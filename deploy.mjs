import { readFileSync } from 'fs';
import {
  rpc, TransactionBuilder, Networks, BASE_FEE,
  Operation, Keypair, Address, nativeToScVal, scValToNative, Contract,
} from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const server = new rpc.Server(RPC_URL);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function poll(hash) {
  let r = await server.getTransaction(hash);
  while (r.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await sleep(1000);
    r = await server.getTransaction(hash);
  }
  return r;
}

async function main() {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error('Set SECRET_KEY env var');
    process.exit(1);
  }
  const kp = Keypair.fromSecret(secretKey);
  console.log('Account:', kp.publicKey());

  const wasmBytes = readFileSync('contract/target/wasm32v1-none/release/live_poll.wasm');
  console.log('WASM:', wasmBytes.length, 'bytes');

  const account = await server.getAccount(kp.publicKey());
  console.log('Sequence:', account.sequenceNumber());

  // Upload WASM
  console.log('\nUploading WASM...');
  const uploadTx = new TransactionBuilder(account, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
    .setTimeout(30)
    .build();

  const prepUpload = await server.prepareTransaction(uploadTx);
  prepUpload.sign(kp);
  const uploadSend = await server.sendTransaction(prepUpload);
  if (uploadSend.status === 'ERROR') {
    console.error('Upload error:', uploadSend.errorResult?.result()?.toString());
    process.exit(1);
  }

  const uploadResult = await poll(uploadSend.hash);
  if (uploadResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    console.error('Upload failed on chain');
    process.exit(1);
  }

  const wasmHash = scValToNative(uploadResult.returnValue);
  console.log('WASM hash:', Buffer.from(wasmHash).toString('hex'));

  // Create contract
  console.log('\nDeploying contract...');
  const account2 = await server.getAccount(kp.publicKey());
  const deployTx = new TransactionBuilder(account2, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.createCustomContract({
      address: Address.fromString(kp.publicKey()),
      wasmHash: Buffer.from(wasmHash),
    }))
    .setTimeout(30)
    .build();

  const prepDeploy = await server.prepareTransaction(deployTx);
  prepDeploy.sign(kp);
  const deploySend = await server.sendTransaction(prepDeploy);
  if (deploySend.status === 'ERROR') {
    console.error('Deploy error:', deploySend.errorResult?.result()?.toString());
    process.exit(1);
  }

  const deployResult = await poll(deploySend.hash);
  if (deployResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    console.error('Deploy failed on chain');
    process.exit(1);
  }

  const contractId = scValToNative(deployResult.returnValue);
  console.log('\n=== Deployed ===');
  console.log('Contract ID:', contractId.toString());
  console.log('Deploy tx:', deploySend.hash);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
