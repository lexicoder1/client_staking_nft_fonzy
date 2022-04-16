interface Ifroggynft{
    function ownerOf(uint256 tokenId) external view  returns (address);

    function transferFrom(address from,address to,uint256 tokenId) external; 
    
}