pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import  "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import  "@openzeppelin/contracts/access/Ownable.sol";
import   "@openzeppelin/contracts/utils/Strings.sol";
import  "./nftinterface.sol";
import  "./ribbitinterface.sol";
import "./erc20interface.sol";

contract StakeFroggies is IERC721Receiver, Ownable {
    using Strings for uint256;
    address public froggyAddress;
    address public ribbitAddress;
    Ifroggynft _froggynft;
    ribbit _ribbit;
    erc20interface _erc20interface;
    bool public started=true;
    bytes32 public root=0x339f267449a852acfbd5c472061a8fc4941769c9a3a9784778e7e95f9bb8f18d;
    uint[] public rewardtier=[20,30,40,75,150]; 
    mapping(uint => mapping(address => uint)) private idtostartingtimet;
    mapping(address=>uint[]) allnftstakeforaddress;
    mapping(uint => uint ) idtokenrate;
    mapping(uint =>address) idtostaker;
    
   




    constructor(address _froggyAddress) {
        _froggynft=Ifroggynft(_froggyAddress);
    }

    function isValid(bytes32[] memory proof,string memory numstr)internal view returns(bool){
       bytes32 leaf= keccak256(abi.encodePacked(numstr));
       return MerkleProof.verify(proof,root,leaf);
   }

   function setribbitAddress(address add)public onlyOwner{
       _ribbit=ribbit(add);
   }

   function setrewardtier(uint[] memory settier )public onlyOwner{
         rewardtier=settier;
   }

    function setroot(bytes32  _root)public onlyOwner{
         root=_root; 
   }

   function geTokenrewardrate(uint tokenId,bytes32[] memory proof)public view returns(uint){
        for (uint i;i< rewardtier.length;i++){
         string memory numstring=string(abi.encodePacked(tokenId.toString(),rewardtier[i].toString()));
  
         if(isValid(proof,numstring)==true){
             return rewardtier[i];

         }
         } 
   }

  //  function stake(uint tokenId ,bytes32[] memory proof)external{
  //   require (_froggynft.ownerOf(tokenId)==msg.sender,"not your froggynft");
  //   idtostartingtimet[tokenId][msg.sender]=block.timestamp;
  //   _froggynft.transferFrom(msg.sender,address(this),tokenId);
  //   idtostaker[tokenId]=msg.sender;
  //    idtokenrate[tokenId]= geTokenrewardrate(tokenId,proof);
  //   allnftstakeforaddress[msg.sender].push(tokenId); 
  //  } 
  function setstakingstate()public onlyOwner{
    started=!started;
  }

  

   function stake(uint[] memory tokenIds ,bytes32[][] memory proof)external{
     require(started==true,"staking is paused");
     uint256[] memory _tokenIds = new uint256[](tokenIds.length);
      _tokenIds=tokenIds;
    for (uint i ;i< _tokenIds.length; i++){
    require (_froggynft.ownerOf( _tokenIds[i])==msg.sender,"not your froggynft");
    idtostartingtimet[_tokenIds[i]][msg.sender]=block.timestamp;
    _froggynft.transferFrom(msg.sender,address(this),_tokenIds[i]);
    idtostaker[_tokenIds[i]]=msg.sender;
     idtokenrate[_tokenIds[i]]= geTokenrewardrate(_tokenIds[i],proof[i]);
    allnftstakeforaddress[msg.sender].push(_tokenIds[i]); 
    }
   } 



  //  function unstake(uint tokenId)external{
  //      require(idtostaker[tokenId]==msg.sender,"you are not the staker");
  //      _froggynft.transferFrom(address(this),msg.sender,tokenId);
  //        for (uint i;i<allnftstakeforaddress[msg.sender].length;i++){
  //           if(allnftstakeforaddress[msg.sender][i]==tokenId){
  //               allnftstakeforaddress[msg.sender][i]=allnftstakeforaddress[msg.sender][allnftstakeforaddress[msg.sender].length-1];
  //               allnftstakeforaddress[msg.sender].pop();
  //               break;
  //           }
  //       }

  //         uint current;
  //         uint reward;
  //        delete idtostaker[tokenId];
  //            if (idtostartingtimet[tokenId][msg.sender]>0 ){
  //                uint rate= idtokenrate[tokenId];
  //          current = block.timestamp - idtostartingtimet[tokenId][msg.sender];
  //            reward = ((rate*10**18)*current)/86400;
  //            _ribbit.mint(msg.sender,reward);
  //         idtostartingtimet[tokenId][msg.sender]=0;
  //          }
        


  //  }

   function unstake(uint[] memory tokenIds)external{
      uint256[] memory _tokenIds = new uint256[](tokenIds.length);
      _tokenIds=tokenIds;
     for (uint i ;i< _tokenIds.length; i++){
       require(idtostaker[_tokenIds[i]]==msg.sender,"you are not the staker");
       _froggynft.transferFrom(address(this),msg.sender,_tokenIds[i]);
         for (uint j;j<allnftstakeforaddress[msg.sender].length;j++){
            if(allnftstakeforaddress[msg.sender][j]==_tokenIds[i]){
                allnftstakeforaddress[msg.sender][j]=allnftstakeforaddress[msg.sender][allnftstakeforaddress[msg.sender].length-1];
                allnftstakeforaddress[msg.sender].pop();
                break;
            }
        }

          uint current;
          uint reward;
         delete idtostaker[_tokenIds[i]];
             if (idtostartingtimet[_tokenIds[i]][msg.sender]>0 ){
                 uint rate= idtokenrate[_tokenIds[i]];
           current = block.timestamp - idtostartingtimet[_tokenIds[i]][msg.sender];
             reward = ((rate*10**18)*current)/86400;
             _ribbit.mint(msg.sender,reward);
          idtostartingtimet[_tokenIds[i]][msg.sender]=0;
           }

     }
        


   }

   function claimreward() public {
        
      uint256[] memory tokenIds = new uint256[](allnftstakeforaddress[msg.sender].length);
      tokenIds= allnftstakeforaddress[msg.sender] ;
         
      uint current;
      uint reward;
      uint rewardbal;
      for (uint i ;i< tokenIds.length; i++){
             
             if (idtostartingtimet[tokenIds[i]][msg.sender]>0 ){
                 uint rate= idtokenrate[tokenIds[i]];
           current = block.timestamp - idtostartingtimet[tokenIds[i]][msg.sender];
             reward = ((rate*10**18)*current)/86400;
            rewardbal+=reward;
          idtostartingtimet[tokenIds[i]][msg.sender]=block.timestamp;
           }
        }

         _ribbit.mint(msg.sender,rewardbal);
        

    }

   

   function checkrewardbal(uint tokenId)public view returns(uint){
        uint current;
      uint reward;

       if (idtostartingtimet[tokenId][msg.sender]>0 ){
                 uint rate= idtokenrate[tokenId];
           current = block.timestamp - idtostartingtimet[tokenId][msg.sender];
             reward = ((rate*10**18)*current)/86400;
            
       
        return reward;
   }
   }

    function checkrewardbalforall()public view returns(uint){
        uint256[] memory tokenIds = new uint256[](allnftstakeforaddress[msg.sender].length);
      tokenIds= allnftstakeforaddress[msg.sender] ;
         
      uint current;
      uint reward;
      uint rewardbal;
      for (uint i ;i< tokenIds.length; i++){
             
             if (idtostartingtimet[tokenIds[i]][msg.sender]>0 ){
                 uint rate= idtokenrate[tokenIds[i]];
           current = block.timestamp - idtostartingtimet[tokenIds[i]][msg.sender];
             reward = ((rate*10**18)*current)/86400;
            rewardbal+=reward;
        //   idtostartingtimet[tokenIds[i]][msg.sender]=block.timestamp;
           }
        }
        return rewardbal;
   }
  

   function checkallnftstaked()public view returns(uint[] memory){
       return allnftstakeforaddress[msg.sender]; 
   }
   
   function withdrawerc20(address erc20addd,address _to)public onlyOwner{
     _erc20interface=erc20interface(erc20addd);
      _erc20interface.transfer(_to, _erc20interface.balanceOf(address(this)));
   }

  //  function withdrawether(address _to)public onlyOwner{
  //   payable(_to).transfer(address(this).balance);
  //  }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

}