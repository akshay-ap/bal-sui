import {
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  Network,
} from "@mysten/sui.js";
import { fromB64 } from "@mysten/bcs";
import * as dotenv from "dotenv";

dotenv.config();
// connect to local RPC server
const provider = new JsonRpcProvider(Network.LOCAL);
const privateKey = process.env.PRIVATE_KEY;
const secretKey = fromB64(privateKey);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

const getPublicKey = async () => {
  return "0x" + keypair.getPublicKey().toSuiAddress();
};

console.log(await getPublicKey());

const callMove = async () => {
  const signer = new RawSigner(keypair, provider);
  const moveCallTxn = await signer.executeMoveCall({
    packageObjectId: "0x2",
    module: "devnet_nft",
    function: "mint",
    typeArguments: [],
    arguments: [
      "Example NFT",
      "An NFT created by the wallet Command Line Tool",
      "ipfs://bafkreibngqhl3gaa7daob4i2vccziay2jjlp435cf66vhono7nrvww53ty",
    ],
    gasBudget: 10000,
  });
  console.log("moveCallTxn", moveCallTxn);
};

await callMove();
