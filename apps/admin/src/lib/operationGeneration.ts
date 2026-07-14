export type OperationToken = {
  readonly generation: number;
  readonly routeKey: string;
};

export type OperationGeneration = {
  readonly begin: (routeKey: string) => OperationToken;
  readonly invalidate: () => void;
  readonly isCurrent: (token: OperationToken, routeKey: string) => boolean;
};

export function createOperationGeneration(): OperationGeneration {
  let generation = 0;

  return {
    begin(routeKey) {
      generation += 1;
      return { generation, routeKey };
    },
    invalidate() {
      generation += 1;
    },
    isCurrent(token, routeKey) {
      return token.generation === generation && token.routeKey === routeKey;
    },
  };
}
