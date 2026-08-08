export class TradeTransitionError extends Error {
  constructor(
    public readonly fromState: string,
    public readonly action: string,
  ) {
    super(`Invalid transition: cannot apply ${action} from ${fromState}`);
    this.name = 'TradeTransitionError';
  }
}
