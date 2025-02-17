async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const BearBucks = await ethers.getContractFactory("BearBucks");
  const bearBucks = await BearBucks.deploy();
  await bearBucks.deployed();

  console.log("BearBucks deployed to:", bearBucks.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
