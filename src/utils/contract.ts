import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Contract,
  Address,
  xdr,
} from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(RPC_URL);

export interface PollData {
  question: string;
  options: string[];
  votes: Record<number, number>;
  hasVoted: boolean;
  totalVoters: number;
}

export async function getPollData(
  contractId: string,
  publicKey: string
): Promise<PollData> {
  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  const question = await simulateRead<string>(
    account,
    contract,
    'get_question'
  );

  const options = await simulateRead<string[]>(
    account,
    contract,
    'get_options'
  );

  const votesMap = await simulateRead<Map<number, number>>(
    account,
    contract,
    'get_votes'
  );

  const votes: Record<number, number> = {};
  if (votesMap && typeof votesMap === 'object') {
    for (const [key, val] of Object.entries(votesMap)) {
      votes[Number(key)] = Number(val);
    }
  }

  const hasVoted = await simulateRead<boolean>(
    account,
    contract,
    'has_voted',
    Address.fromString(publicKey).toScVal()
  );

  const totalVoters = await simulateRead<number>(
    account,
    contract,
    'get_total_voters'
  );

  return {
    question: question || '',
    options: options || [],
    votes,
    hasVoted: !!hasVoted,
    totalVoters: Number(totalVoters || 0),
  };
}

async function simulateRead<T>(
  account: any,
  contract: Contract,
  method: string,
  ...args: xdr.ScVal[]
): Promise<T | null> {
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    console.warn(`Simulation error for ${method}:`, sim.error);
    return null;
  }

  if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
    return scValToNative(sim.result.retval) as T;
  }

  return null;
}

export interface CastVoteResult {
  hash: string;
  status: 'pending' | 'success' | 'failed';
}

export async function castVote(
  contractId: string,
  publicKey: string,
  optionIndex: number,
  signTransaction: (xdr: string) => Promise<string>
): Promise<CastVoteResult> {
  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'vote',
        Address.fromString(publicKey).toScVal(),
        nativeToScVal(optionIndex, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);

  const signedXdr = await signTransaction(preparedTx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);

  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    if (sendResult.errorResult) {
      const resultMeta = sendResult.errorResult.result().switch();
      if (resultMeta === xdr.TransactionResultCode.txInsufficientBalance()) {
        throw new InsufficientBalanceError(
          'Insufficient balance to complete this transaction. You need at least 1.5 XLM for the contract entry.'
        );
      }
      throw new TransactionError(
        `Transaction failed: ${resultMeta.name || 'Unknown error'}`
      );
    }
    throw new TransactionError('Transaction submission returned an error');
  }

  const hash = sendResult.hash;

  let txResult = await server.getTransaction(hash);
  let attempts = 0;
  while (txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    txResult = await server.getTransaction(hash);
    attempts++;
  }

  if (txResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    return { hash, status: 'failed' };
  }

  return { hash, status: 'success' };
}

export class WalletNotFoundError extends Error {
  constructor(message?: string) {
    super(message || 'No Stellar wallet found. Please install Freighter, Lobstr, or another Stellar wallet extension.');
    this.name = 'WalletNotFoundError';
  }
}

export class UserRejectedError extends Error {
  constructor(message?: string) {
    super(message || 'Connection was rejected by the user.');
    this.name = 'UserRejectedError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message?: string) {
    super(message || 'Insufficient balance.');
    this.name = 'InsufficientBalanceError';
  }
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}
