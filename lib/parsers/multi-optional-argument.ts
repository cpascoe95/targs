import { Token } from '../tokens';
import { IEvaluatedArgument } from './argument';
import { Optional, IOptionalOptions } from './optional';


export interface IMultiOptionalArgumentOptions<T> extends IOptionalOptions {
  metaVar: string;
  parse: (val: string) => T;
}


export class MultiOptionalArgument<T> extends Optional<T[]> {
  public readonly metaVar: string;

  private parse: (val: string) => T;

  constructor(options: IMultiOptionalArgumentOptions<T>) {
    super(options);
    this.metaVar = options.metaVar;
    this.parse = options.parse;
  }

  public evaluate(tokens: Token[]): IEvaluatedArgument<T[]> {
    let newTokens = tokens.map(token => token);

    const result: T[] = [];

    for (let i = newTokens.length - 1; i >= 0; i--) {
      const token = newTokens[i];

      if (token.type === 'short' && token.value === this.short || token.type === 'long' && token.value === this.long) {
        if (token.argument !== null) {
          result.unshift(this.parse(token.argument));
          newTokens.splice(i, 1);
          continue;
        }

        if (i + 1 >= newTokens.length) {
          throw new Error(`${this.getShortLongOptions()} requires an argument`);
        }

        const nextToken = newTokens[i + 1];

        if (nextToken.type !== 'arg') {
          throw new Error(`${this.getShortLongOptions()} requires an argument`);
        }

        result.unshift(this.parse(nextToken.argument));
        newTokens.splice(i, 2);
      }
    }

    return {
      newTokens,
      value: result
    };
  }

  public getUsageExample(): string {
    return `[${this.getUsageExampleOption()} ${this.metaVar}...]`;
  }
}