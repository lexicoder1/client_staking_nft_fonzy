import { formatEther, parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BytesLike, ContractFactory, Wallet, utils } from "ethers";
import { ethers } from "hardhat";
import MerkleTree from "merkletreejs";
import { FroggyFriends } from './../types/FroggyFriends';
const { keccak256 } = utils;


describe("Froggy Friends", async () => {
  let factory: ContractFactory;
  let contract: FroggyFriends;
  let owner: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;
  let froggyPreviewUrl = "https://api.froggyfriendsmint.com/preview";
  let froggyUrl = "https://api.froggyfriendsmint.com/";
  let adoptionFee = "0.03";
  let froggyList: MerkleTree;
  const founder = "0x3E7BBe45D10B3b92292F150820FC0E76b93Eca0a";
  const projectManager = "0x818867901f28de9A77117e0756ba12E90B957242";
  const developer = "0x1AF8c7140cD8AfCD6e756bf9c68320905C355658";
  const community = "0xc4e3ceB4D732b1527Baf47B90c3c479AdC02e39A";

  async function mint(user: SignerWithAddress, froggies: number) {
    const value = parseEther(adoptionFee).mul(froggies);
    await contract.connect(user).publicAdopt(froggies, { value: value });
  }

  async function mintFroggylist(user: SignerWithAddress, froggies: number, proof: BytesLike[]) {
    const value = parseEther(adoptionFee).mul(froggies);
    await contract.connect(user).froggylistAdopt(froggies, proof, { value: value });
  }

  before(async () => {
    [owner, acc2, acc3] = await ethers.getSigners();
    let addresses = [keccak256(owner.address), keccak256(acc2.address)];
    froggyList = new MerkleTree(addresses, keccak256, { sortPairs: true });
  });

  beforeEach(async () => {
    [owner, acc2, acc3] = await ethers.getSigners();
    factory = await ethers.getContractFactory("FroggyFriends");
    contract = (await factory.deploy()) as FroggyFriends;
    await contract.deployed();
  });

  describe("public adopt", async () => {
    beforeEach(async () => {
      await contract.setFroggyStatus(2);
    });

    it("public adopting off", async () => {
      await contract.setFroggyStatus(0);
      await expect(contract.publicAdopt(1)).revertedWith("Public adopting is off");
    });

    it("adopt limit per wallet", async () => {
      await mint(acc2, 1);
      await mint(acc2, 1);
      // verify adopted count
      expect(await contract.adopted(acc2.address)).equals(2);
      await expect(contract.publicAdopt(1)).revertedWith("Adoption limit per wallet reached");
    });

    it("insufficient funds", async () => {
      const value = parseEther('0.02');
      await expect(contract.publicAdopt(1, { value: value })).revertedWith("Insufficient funds for adoption");
      await expect(contract.publicAdopt(2, { value: value })).revertedWith("Insufficient funds for adoption");
    });

    it("public adopt", async () => {
      await mint(acc2, 2);
      // verify ownership
      expect(await contract.ownerOf(0)).equals(acc2.address);
      expect(await contract.ownerOf(1)).equals(acc2.address);

      // verify adopted count
      expect(await contract.adopted(acc2.address)).equals(2);
    });

    xit("pond is full", async function () {
      this.timeout(0);
      // mint 4,442
      for (let i = 0; i < 2221; i++) {
        let account = ethers.Wallet.createRandom().connect(ethers.provider);
        // owner sends funds to account to pay for mint
        const gasPrice = await ethers.provider.getGasPrice();
        const gasLimit = 21000;
        const eth = parseEther("0.3");
        await owner.sendTransaction({gasLimit: gasLimit, gasPrice: gasPrice, to: account.address, value: eth});
        // mint 2 froggies
        await contract.connect(account).publicAdopt(2, { value: parseEther(adoptionFee).mul(2)});
      }

      expect(await contract.totalSupply()).equals(4442);
      await mint(acc2, 2);
      expect(await contract.totalSupply()).equals(4444);
      await expect(mint(owner, 2)).revertedWith("Froggy pond is full");
    });

  });

  describe("froggylist adopt", async () => {
    beforeEach(async () => {
      await contract.setFroggyList(froggyList.getHexRoot());
      await contract.setFroggyStatus(1);
    });

    it("froggylist adopting off", async () => {
      await contract.setFroggyStatus(0);
      let proof = froggyList.getHexProof(keccak256(owner.address));
      await expect(contract.froggylistAdopt(1, proof)).revertedWith("Froggylist adopting is off");
    });

    it("not on froggylist", async () => {
      let proof = froggyList.getHexProof(keccak256(acc3.address));
      await expect(contract.connect(acc3).froggylistAdopt(2, proof)).revertedWith("Not on Froggylist");
    });

    it("adopt limit per wallet", async () => {
      let proof = froggyList.getHexProof(keccak256(acc2.address));
      await mintFroggylist(acc2, 2, proof);
      await expect(mintFroggylist(acc2, 1, proof)).revertedWith("Adoption limit per wallet reached");
    });

    it("insufficient funds", async () => {
      let proof = froggyList.getHexProof(keccak256(acc2.address));
      const value = parseEther("0.02");
      await expect(contract.connect(acc2).froggylistAdopt(1, proof, { value: value })).revertedWith("Insufficient funds for adoption");
    });

    it("froggylist adopt", async () => {
      let proof = froggyList.getHexProof(keccak256(acc2.address));
      await mintFroggylist(acc2, 2, proof);
      expect(await contract.ownerOf(0)).equals(acc2.address);
      expect(await contract.ownerOf(1)).equals(acc2.address);
      expect(await contract.adopted(acc2.address)).equals(2);
      expect(await contract.totalSupply()).equals(2);
    });

    xit("pond is full", async function() {
      this.timeout(0);
      
      let addresses: any[] = [];
      for (let i = 0; i < 2222; i++) {
        let account = Wallet.createRandom().connect(ethers.provider);
        // owner sends funds to account to pay for mint
        const gasPrice = await ethers.provider.getGasPrice();
        const gasLimit = 21000;
        const eth = parseEther("0.3");
        await owner.sendTransaction({gasLimit: gasLimit, gasPrice: gasPrice, to: account.address, value: eth});
        addresses.push(account);
      }

      // create new merkle tree with 2,222 accounts
      addresses.push(acc2);
      froggyList = new MerkleTree(addresses.map(wallet => keccak256(wallet.address)), keccak256, { sortPairs: true });
      // whitelist 2,222 accounts
      await contract.setFroggyList(froggyList.getHexRoot());

      // mint 4,444 froggies
      let counter = 0;
      for (const wallet of addresses.slice(0, addresses.length -1)) {
        let proof = froggyList.getHexProof(keccak256(wallet.address));
        const value = parseEther(adoptionFee).mul(2);
        await contract.connect(wallet).froggylistAdopt(2, proof, { value: value });
        counter++;
      }

      expect(await contract.totalSupply()).equals(4444);
      let proof = froggyList.getHexProof(keccak256(acc2.address));
      await expect(mintFroggylist(acc2, 1, proof)).revertedWith("Froggy pond is full");
    });
  });

  describe("Is on froggylist", async () => {
    beforeEach(async () => {
      await contract.setFroggyList(froggyList.getHexRoot());
    });

    it("is on froggylist", async () => {
      let proof = froggyList.getHexProof(keccak256(acc2.address));
      const isOnFroggylist = await contract.isOnFroggylist(acc2.address, proof);
      expect(isOnFroggylist);
    });

    it("is not on froggylist", async () => {
      let proof = froggyList.getHexProof(keccak256(acc3.address));
      const isOnFroggylist = await contract.isOnFroggylist(acc3.address, proof);
      expect(isOnFroggylist).false;
    });
  });

  describe("set methods", async () => {
    it("set froggy url", async () => {
      await contract.setFroggyUrl(froggyUrl);
      expect(await contract.froggyUrl()).equals(froggyUrl);
    });

    it("set adopt limit", async () => {
      await contract.setAdoptLimit(10);
      expect(await contract.adoptLimit()).equals(10);
    });

    it("set adoption fee", async () => {
      let newFee = parseEther("0.05");
      await contract.setAdoptionFee(newFee);
      expect(await contract.adoptionFee()).equals(newFee);
    });

    it("set revealed", async () => {
      await contract.setRevealed(true);
      expect(await contract.revealed()).equals(true);
    });

    it("set froggy status", async () => {
      await contract.setFroggyStatus(0);
      expect(await contract.froggyStatus()).equals(0);
      await contract.setFroggyStatus(1);
      expect(await contract.froggyStatus()).equals(1);
      await contract.setFroggyStatus(2);
      expect(await contract.froggyStatus()).equals(2);
      await expect(contract.setFroggyStatus(3)).revertedWith("Invalid FroggyStatus");
    });

    it("set froggylist", async () => {
      await contract.setFroggyList(froggyList.getHexRoot());
      expect(await contract.froggyList()).equals(froggyList.getHexRoot());
    });
  });

  describe("withdraw", async () => {
    it("verify withdraw funds", async () => {
      await contract.setFroggyStatus(2);
      for (let i = 0; i < 15; i++) {
        let account = ethers.Wallet.createRandom().connect(ethers.provider);
        // owner sends funds to account to pay for mint
        const gasPrice = await ethers.provider.getGasPrice();
        const gasLimit = 21000;
        const eth = parseEther("0.2");
        await owner.sendTransaction({gasLimit: gasLimit, gasPrice: gasPrice, to: account.address, value: eth});
        // mint 2 froggies
        await contract.connect(account).publicAdopt(2, { value: parseEther(adoptionFee).mul(2)});
      }
      // smart contract balance 0.9 eth
      let balance = await contract.provider.getBalance(contract.address);
      expect(formatEther(balance)).equals("0.9");

      // withdraw to team
      await contract.withdraw();

      const founderBalance = await contract.provider.getBalance(founder);
      expect(formatEther(founderBalance)).equals("0.54");

      const projectManagerBalance = await contract.provider.getBalance(projectManager);
      expect(formatEther(projectManagerBalance)).equals("0.162");

      const developerBalance = await contract.provider.getBalance(developer);
      expect(formatEther(developerBalance)).equals("0.108");

      const communityBalance = await contract.provider.getBalance(community);
      expect(formatEther(communityBalance)).equals("0.09");
    });
  });

  describe("token uri", async () => {
    beforeEach(async () => {
      await contract.setFroggyStatus(2);
    });

    it("no base url", async () => {
      await mint(acc2, 2);
      const tokenUri = await contract.tokenURI(0);
      expect(tokenUri).equals("");
    });

    it("pre reveal", async () => {
      await mint(acc2, 2);
      await contract.setFroggyUrl(froggyPreviewUrl);
      const tokenUri = await contract.tokenURI(0);
      expect(tokenUri).equals(froggyPreviewUrl);
    });

    it("post reveal", async () => {
      await mint(acc2, 2);
      await contract.setFroggyUrl(froggyUrl);
      await contract.setRevealed(true);
      const tokenUri = await contract.tokenURI(0);
      expect(tokenUri).equals(`${froggyUrl}0`);
    });
  });
});