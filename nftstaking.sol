pragma solidity ^0.8.10;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import  "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import  "@openzeppelin/contracts/access/Ownable.sol";
import   "@openzeppelin/contracts/utils/Strings.sol";

contract StakeFroggies is IERC721Receiver, Ownable {

    address public froggyAddress;
    address public ribbitAddress;
    bytes32 public root=0x255cb0514f90311a9f0e5de5cda68aa703990d05a93de1bc888d351eb52a99f3;
    uint[] public rewardtier=[20,30,40,75,150]; 



    constructor(address _froggyAddress) {
        froggyAddress = _froggyAddress;
    }

    function isValid(bytes32[] memory proof,string memory numstr)internal view returns(bool){
       bytes32 leaf= keccak256(abi.encodePacked(numstr));
       return MerkleProof.verify(proof,root,leaf);
   }

   function setrewardtier(uint[] memory settier )public onlyOwner{
         rewardtier=settier;
   }

    function setroot(bytes32  _root)public onlyOwner{
         root=_root; 
   }


    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}