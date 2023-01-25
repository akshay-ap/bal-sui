import {
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  Network,
} from "@mysten/sui.js";
import { fromB64 } from "@mysten/bcs";
import * as dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";

dotenv.config();
// connect to local RPC server
const provider = new JsonRpcProvider(Network.LOCAL);

const privateKey = process.env.PRIVATE_KEY;
const secretKey = fromB64(privateKey);
const keypair = Ed25519Keypair.fromSecretKey(secretKey);

const app = express();

const subscriptions = [];
let lastTransactionScannedCount = await provider.getTotalTransactionNumber();

app.use(bodyParser.json());

app.post("/invoke", async (req, res, next) => {
  try {
    const data = req.body;
    console.log("Invoke called with body:", data);
    const smartContractPath = data.smartContractPath.split("/");
    const packageObjectId = smartContractPath[0];
    const module = smartContractPath[1];

    const { inputs, outputs, functionIdentifier } = data;

    const callArguments = inputs.map((e) => e.value);

    const result = await callMove(
      packageObjectId,
      module,
      functionIdentifier,
      data.typeArguments,
      callArguments
    );

    const transactionDigest =
      result["EffectsCert"]["certificate"]["transactionDigest"];

    res.json({ transactionHash: transactionDigest });
  } catch (err) {
    next(err);
  }
});

app.post("/get-blocks-in-range", async (req, res, next) => {
  try {
    const data = req.body;
    const smartContractPath = data["smartContractPath"];
    const eventIdentifier = data["eventIdentifier"];

    const start = data["start"];
    const end = data["end"];

    const filter = data["filter"];
    const parameters = data["parameters"];

    provider.getTransactions({});

    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post("/query", async (req, res, next) => {
  try {
    const data = req.body;

    const functionIdentifier = data["functionIdentifier"];
    const eventIdentifier = data["eventIdentifier"];

    const filter = data["filter"];
    const timeframe = data["timeFrame"];
    const parameters = data["parameters"];

    let result;
    if (functionIdentifier && functionIdentifier !== "") {
      // function invocation query

      result = await queryFunctionInvocation(functionIdentifier);
    } else {
      //event query
      result = await queryEvent(eventIdentifier, filter, timeframe, parameters);
    }

    // TimeRange: { startTime: 0, endTime: 1669039604014000 },

    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post("/subscribe", async (req, res, next) => {
  try {
    const data = req.body;

    subscriptions.push(devNftSub);
    res.json({ result: "successful" });
  } catch (err) {
    next(err);
  }
});

app.post("/unsubscribe", async (req, res, next) => {
  try {
    console.log(req.body);
    await callMove();
    res.json({ message: "from index api" });
  } catch (err) {
    next(err);
  }
});

app.post("/txdata", async (req, res, next) => {
  try {
    const txId = req.body["txId"];
    const txEvents = await provider.getTransactionWithEffects(txId);
    res.json({ result: txEvents });
  } catch (err) {
    next(err);
  }
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running`);
});

const callMove = async (
  packageObjectId,
  module,
  function_name,
  typeArguments,
  call_arguments
) => {
  const signer = new RawSigner(keypair, provider);
  const moveCallTxn = await signer.executeMoveCall({
    packageObjectId: packageObjectId,
    module: module,
    function: function_name,
    typeArguments: typeArguments,
    arguments: call_arguments,
    gasBudget: 10000,
  });
  console.log("moveCallTxn", moveCallTxn);
  return moveCallTxn;
};

const scanForNewTransactions = async () => {
  console.log("Start to scan for new transactions");
  const newTxCount = await provider.getTotalTransactionNumber();
  if (lastTransactionScannedCount < newTxCount) {
    console.log(
      `Found new transactions: ${newTxCount - lastTransactionScannedCount}`
    );
    lastTransactionScannedCount = newTxCount;
  }
  console.log("End scanning transactions");
};

// setInterval(scanForNewTransactions, 1000 * 10);

const queryEvent = async (eventIdentifier, filter, timeframe, parameters) => {
  // const eventFilter = { MoveEvent: eventIdentifier };

  const eventFilter = {
    TimeRange: {
      startTime: Number(timeframe["from"]),
      endTime: Number(timeframe["to"]),
    },
  };
  const result = await provider.getEvents(
    eventFilter,
    null,
    1000,
    "descending"
  );

  const filteredResult = result["data"].filter((e) => {
    if (e["event"]["moveEvent"] === undefined) return false;
    if (e["event"]["moveEvent"]["type"] === eventIdentifier) return true;
  });

  const transformedResult = transformQueryResult(filteredResult);

  // TODO filter

  return transformedResult;
};

const queryFunctionInvocation = async (
  functionIdentifier,
  filter,
  timeframe,
  parameters
) => {
  const info = functionIdentifier.split("/");
  // Todo: Transform result
  const devnetNftFilter = {
    MoveModule: { package: info[0], module: info[1] },
  };
  const result = await provider.getEvents(devnetNftFilter);
  return result;
};

const transformQueryResult = (data) => {
  let result = [];

  for (let i = 0; i < data.length; i++) {
    const fields = data[i]["event"]["moveEvent"]["fields"];
    const keys = Object.keys(fields);
    const parameters = [];
    for (let j = 0; j < keys.length; j++) {
      parameters.push({
        name: keys[j],
        value: fields[keys[j]],
        type: "string",
      });
    }
    result.push({
      isoTimestamp: new Date(data[i]["timestamp"]).toISOString(),
      parameters: parameters,
    });
  }

  return result;
};
