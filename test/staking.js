const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');



let rarityamount=[]
let rarityband={"common":[3,4],
                  "uncommon":[5,6],
                  "rare":[7,8],
                  "legendary":[9,10],
                  "epic":[11,12]
                }
function generate(){
    

    
  for (let i=0;i<rarityband.common.length;i++){
        let q='' + rarityband.common[i] +20
        rarityamount.push(q)
       
  }
  for (let i=0;i< rarityband.uncommon.length;i++){
      let q= '' + rarityband.uncommon[i] +30
      rarityamount.push(q)
  }
  
  for (let i=0;i< rarityband.rare.length;i++){
      let q= '' + rarityband.rare[i] +40
      rarityamount.push(q)
     
  }

  for (let i=0;i< rarityband.legendary.length;i++){
      let q= '' + rarityband.legendary[i] +75
      rarityamount.push(q)
     
  }

  for (let i=0;i<rarityband.epic.length;i++){
      let q= '' + rarityband.epic[i] +150
      rarityamount.push(q)
     
  }

   
  

}

generate()



describe("Testing froggy staking contract ", async function () {
  let  froggyNft_;
  let  ribbittoken;
  let  ribbittoken_;
  let  stakingfroggy;
  let  stakingfroggy_;
  let  tree;
  let  signer1;
  let  signer2;
  let  root;
  let oneday=1*24*60*60;
  

  before(async function () {
  
    const signers = await ethers.getSigners();
    let add="0xc4e3ceb4d732b1527baf47b90c3c479adc02e39a"
    await hre.network.provider.request({                               
      method: "hardhat_impersonateAccount",
      params: [add],
    });
    signer1 = await ethers.getSigner(add);
    signer2 = signers[1];
    signer3 = signers[3];
    const tx = await signer2.sendTransaction({
      to: "0xc4e3ceb4d732b1527baf47b90c3c479adc02e39a",
      value: ethers.utils.parseEther("20")
    });
  
    froggyNft_ = (
      await ethers.getContractAt(                                
        "FroggyFriends",
        "0x29652c2e9d3656434bc8133c69258c8d05290f41"
      )
    );
    ribbittoken = await ethers.getContractFactory("Ribbit");
    ribbittoken_ = await ribbittoken.deploy("ribbit","ribbit");
    await  ribbittoken_.deployed();
    
    stakingfroggy = await ethers.getContractFactory("StakeFroggies");
    stakingfroggy_ = await stakingfroggy.deploy(froggyNft_.address);
    await  stakingfroggy_.deployed();
    await stakingfroggy_.setribbitAddress(ribbittoken_.address)
    await  ribbittoken_.setapprovedcontractaddress(stakingfroggy_.address)
    
    await  froggyNft_.connect(signer1).transferFrom( signer1.address, signer2.address,10)
    await froggyNft_.connect(signer1).setApprovalForAll(stakingfroggy_.address,true)
    await froggyNft_.connect(signer2).setApprovalForAll(stakingfroggy_.address,true)
    


    const leaves = rarityamount.map(x => keccak256(x))
    const _tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
    tree=_tree
    const _root = _tree.getRoot().toString('hex');
    root='0x'+_root;
   

  });

  it("Should return the correct merkle root ", async function () {
    await  stakingfroggy_.setroot(root);
    expect(await  stakingfroggy_.root()).to.equal(root);
  });

  it("Should return the correct reward rate of an id ", async function () {
    const leaf1 = keccak256("420")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    const leaf2 = keccak256("530")
    const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))

    const leaf3 = keccak256("840")
    const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
    const leaf4 = keccak256("1075")
    const proof4 = tree.getProof(leaf4).map(x=>'0x'+ x.data.toString('hex'))
    
    const leaf5 = keccak256("12150")
    const proof5 = tree.getProof(leaf5).map(x=>'0x'+ x.data.toString('hex'))
    expect(await  stakingfroggy_.geTokenrewardrate(4,proof1)).to.equal(20);
     expect(await  stakingfroggy_.geTokenrewardrate(5,proof2)).to.equal(30);
    expect(await  stakingfroggy_.geTokenrewardrate(8,proof3)).to.equal(40);
     expect(await  stakingfroggy_.geTokenrewardrate(10,proof4)).to.equal(75);
    expect(await  stakingfroggy_.geTokenrewardrate(12,proof5)).to.equal(150);
  });

  it("Should return all nft staked of an address", async function () {
    const leaf1 = keccak256("420")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    const leaf2 = keccak256("530")
    const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))

    const leaf3 = keccak256("740")
    const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
    await  stakingfroggy_.connect(signer1).stake([4,5,7],[ proof1 , proof2, proof3])
    const Tx=await  stakingfroggy_.connect(signer1).checkallnftstaked(signer1.address)
     console.log(Tx[0].toString())
    expect(Number(Tx[0].toString())).to.equal(4);
    expect(Number(Tx[1].toString())).to.equal(5);
    expect(Number(Tx[2].toString())).to.equal(7);
    await  stakingfroggy_.connect(signer1).unstake([4,5,7])
  });

  it("Should return empty when all nft of an address is unstaked", async function () {
    const leaf1 = keccak256("420")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    const leaf2 = keccak256("530")
    const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))

    const leaf3 = keccak256("740")
    const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
    await  stakingfroggy_.connect(signer1).stake([4,5,7],[ proof1 , proof2, proof3])
    const Tx=await  stakingfroggy_.connect(signer1).checkallnftstaked(signer1.address)
    await  stakingfroggy_.connect(signer1).unstake([4,5,7])
    const Tx2=await  stakingfroggy_.connect(signer1).checkallnftstaked(signer1.address)
    console.log("check checkallnftstaked after unstake", Tx2)
    expect(Tx2[0]).to.equal();
    expect(Tx2[1]).to.equal();
    expect(Tx2[2]).to.equal();
    
  });

  it("Should return the correct reward balance of an nft for an address when staked for one day", async function () {
    
    const leaf1 = keccak256("320")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    const leaf2 = keccak256("630")
    const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))

    const leaf3 = keccak256("840")
    const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
    await  stakingfroggy_.connect(signer1).stake([3,6,8],[ proof1 , proof2, proof3])
    const blockNumBefore = await ethers.provider.getBlockNumber();
    console.log(blockNumBefore)
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    let timestampBefore= blockBefore.timestamp;
    await ethers.provider.send('evm_setNextBlockTimestamp', [ timestampBefore+oneday]);
    await ethers.provider.send('evm_mine');
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(3)).to.equal("20000000000000000000")
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(6)).to.equal("30000000000000000000")
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(8)).to.equal("40000000000000000000")

  });

  
  it("Should return zero balance of an nft for an address when unstaked", async function () {
    
    await  stakingfroggy_.connect(signer1).unstake([3,6,8])
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(3)).to.equal("0")
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(6)).to.equal("0")
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(8)).to.equal("0")
    
  });

  it("Should check the summation of reward balance of all nft staked for one day for an address", async function () {
    
    const leaf1 = keccak256("320")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    const leaf2 = keccak256("630")
    const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))

    const leaf3 = keccak256("840")
    const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
    await  stakingfroggy_.connect(signer1).stake([3,6,8],[ proof1 , proof2, proof3])
    const blockNumBefore = await ethers.provider.getBlockNumber();
    console.log(blockNumBefore)
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    let timestampBefore= blockBefore.timestamp;
    await ethers.provider.send('evm_setNextBlockTimestamp', [ timestampBefore+oneday]);
    await ethers.provider.send('evm_mine');
    expect(await stakingfroggy_.connect(signer1).checkrewardbalforall(signer1.address)).to.equal("90000000000000000000")
    console.log(await stakingfroggy_.connect(signer1).checkrewardbalforall(signer1.address))
    await  stakingfroggy_.connect(signer1).unstake([3,6,8])
   
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(3)).to.equal("0")
    expect(await stakingfroggy_.connect(signer1).checkrewardbal(6)).to.equal("0")
  expect(await stakingfroggy_.connect(signer1).checkrewardbal(8)).to.equal("0")
  });

  it("Should check reward balance minted to an address when reward is claimed", async function () {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    console.log(blockNumBefore)
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    let timestampBefore= blockBefore.timestamp;
    const leaf1 = keccak256("1075")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
    await  stakingfroggy_.connect(signer2).stake([10],[ proof1 ])
    await ethers.provider.send('evm_setNextBlockTimestamp', [ timestampBefore+oneday]);
    await ethers.provider.send('evm_mine');
    await stakingfroggy_.connect(signer2).claimreward()
    expect(await ribbittoken_.balanceOf(signer2.address)).to.equal("75000000000000000000")
  });

  it("Should ensure only owner can set ribbit address ", async function () {
  await expect(stakingfroggy_.connect(signer2).setribbitAddress(ribbittoken_.address)).revertedWith("Ownable: caller is not the owner");
  })

  it("Should ensure only owner can set reward tier", async function () {
    await expect(stakingfroggy_.connect(signer2).setrewardtier([1,2,3,4,5] )).revertedWith("Ownable: caller is not the owner");
    })
   

  it("Should ensure only owner can set root", async function () {
      await expect(stakingfroggy_.connect(signer2).setroot(root)).revertedWith("Ownable: caller is not the owner");
      })

  it("Should ensure only owner can set staking state ", async function () {
      await expect(stakingfroggy_.connect(signer2).setstakingstate()).revertedWith("Ownable: caller is not the owner");
        })

  it("Should ensure only staker can unstake", async function () {
    const leaf1 = keccak256("320")
    const proof1 = tree.getProof(leaf1).map(x=>'0x'+ x.data.toString('hex'))
   
    await  stakingfroggy_.connect(signer1).stake([3],[ proof1 ])
          await expect(stakingfroggy_.connect(signer2).unstake([3])).revertedWith("you are not the staker");
        })

      
    it("Should ensure no one can stake when stake is paused", async function () {
      const leaf2 = keccak256("420")
      const proof2 = tree.getProof(leaf2).map(x=>'0x'+ x.data.toString('hex'))
      await  stakingfroggy_.setstakingstate()
     
      await expect(stakingfroggy_.connect(signer1).stake([4],[proof2])).revertedWith("staking is paused");
        })

   
    it("Should ensure only staker can unstake", async function () {
       const leaf3 = keccak256("630")
       const proof3 = tree.getProof(leaf3).map(x=>'0x'+ x.data.toString('hex'))
       await  stakingfroggy_.setstakingstate() 
       await stakingfroggy_.connect(signer1).stake([6],[proof3])
       await stakingfroggy_.connect(signer1).unstake([6])
       await froggyNft_.connect(signer1).transferFrom(signer1.address, signer2.address,6)
       await froggyNft_.connect(signer2).setApprovalForAll(stakingfroggy_.address,true)
       await stakingfroggy_.connect(signer2).stake([6],[proof3])
       await expect(stakingfroggy_.connect(signer1).unstake([6])).revertedWith("you are not the staker");
        
        })

      
 
});