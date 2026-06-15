import { Horizon, BASE_FEE, Networks } from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

const server = new Horizon.Server(HORIZON_URL);

export async function getBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native');
  return xlmBalance ? xlmBalance.balance : '0';
}

export async function getMinimumBalance(): Promise<string> {
  return '1.5';
}

export { server as horizonServer, BASE_FEE, Networks };
