export class CancelableValue<T = unknown> {
  value: T;
  private _cancel: () => Promise<void>;
  constructor(value: T, cancel: () => Promise<void>) {
    this.value = value;
    this._cancel = cancel;
  }
  cancel(): Promise<void> {
    return this._cancel();
  }
}

export type CancelableReturnType<T extends (...a: any) => unknown> = (
  ...a: Parameters<T>
) => ReturnType<T>;
