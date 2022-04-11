pragma solidity 0.8.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Strings.sol";
contract merkle{
   using Strings for uint256;
   bytes32 public root=0x255cb0514f90311a9f0e5de5cda68aa703990d05a93de1bc888d351eb52a99f3;
   string public h;
   uint public check;
//    string public d="245010";
   bytes32 public leaf;
   function isValid(bytes32[] memory proof,string memory numstr)internal view returns(bool){
       bytes32 leaf= keccak256(abi.encodePacked(numstr));
       return MerkleProof.verify(proof,root,leaf);
   }

 
// 2450
    function test(uint tokenid,bytes32[] memory proof)public{
        uint a=10;
        uint b=15;
  h=string(abi.encodePacked(tokenid.toString(),a.toString()));
  
         if(isValid(proof,h)==true){
             check=10;
         }
    }

    // function doo()public {
    //     leaf= keccak256(abi.encodePacked(d));
    // } 

        
        



    
}

