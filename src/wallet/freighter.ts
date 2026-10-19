import * as freighterApi from '@stellar/freighter-api';

export type FreighterConnectionErrorType = 'not-installed' | 'user-rejected' | 'unknown';

export class FreighterConnectionError extends Error {
  constructor(public readonly type: FreighterConnectionErrorType) {
    super(
      type === 'not-installed'
        ? 'Freighter is not installed.'
        : type === 'user-rejected'
          ? 'Connection rejected by user.'
          : 'Connection failed. Please try again.'
    );
    this.name = 'FreighterConnectionError';
  }
}

export type FreighterAdapter = Pick<
  typeof freighterApi,
  'isConnected' | 'requestAccess' | 'getAddress' | 'getNetwork'
>;

const isUserRejection = (error: { code?: number; message?: string }) =>
  error.code === 4001 || /reject|declin|cancel/i.test(error.message ?? '');

const throwForApiError = (error?: { code: number; message: string }) => {
  if (!error) return;
  throw new FreighterConnectionError(isUserRejection(error) ? 'user-rejected' : 'unknown');
};

export async function connectFreighter(
  adapter: FreighterAdapter = freighterApi
): Promise<{ address: string; network: string }> {
  try {
    const connection = await adapter.isConnected();
    throwForApiError(connection.error);
    if (!connection.isConnected) {
      throw new FreighterConnectionError('not-installed');
    }

    const access = await adapter.requestAccess();
    throwForApiError(access.error);

    return await readFreighterAccount(adapter);
  } catch (error) {
    if (error instanceof FreighterConnectionError) throw error;
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string' &&
      isUserRejection({
        code: 'code' in error && typeof error.code === 'number' ? error.code : undefined,
        message: error.message,
      })
    ) {
      throw new FreighterConnectionError('user-rejected');
    }
    throw new FreighterConnectionError('unknown');
  }
}

export async function getFreighterConnection(
  adapter: FreighterAdapter = freighterApi
): Promise<{ address: string; network: string }> {
  try {
    const connection = await adapter.isConnected();
    throwForApiError(connection.error);
    if (!connection.isConnected) {
      throw new FreighterConnectionError('not-installed');
    }

    return await readFreighterAccount(adapter);
  } catch (error) {
    if (error instanceof FreighterConnectionError) throw error;
    throw new FreighterConnectionError('unknown');
  }
}

async function readFreighterAccount(
  adapter: FreighterAdapter
): Promise<{ address: string; network: string }> {
  const account = await adapter.getAddress();
  throwForApiError(account.error);
  if (!account.address) {
    throw new FreighterConnectionError('unknown');
  }

  const network = await adapter.getNetwork();
  throwForApiError(network.error);
  if (!network.network) {
    throw new FreighterConnectionError('unknown');
  }

  return { address: account.address, network: network.network };
}
