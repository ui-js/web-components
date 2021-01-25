export interface Disposable {
  dispose(): void;
}

export type EventListener = (...payload: any[]) => void;

//  class EventEmitter {
//   events: Map<string, EventListener[]>;

//   constructor() {
//     this.events = new Map();
//   }

//   addListener(
//     event: string,
//     listener: EventListener,
//     options?: { once?: boolean }
//   ): Disposable {
//     if (!this.events.has(event)) {
//       this.events.set(event, []);
//     }

//     options = options ?? {};
//     if (options.once ?? false) {
//       listener = (...payload: any[]): void => {
//         this.events.get(event)!.filter((x) => x !== listener);
//         listener.apply(this, ...payload);
//       };
//     }

//     this.events.get(event)!.push(listener);
//     return {
//       dispose: (): void => {
//         this.events.set(
//           event,
//           this.events.get(event)!.filter((x) => x !== listener)
//         );
//       },
//     };
//   }

//   on(event: string, listener: EventListener): Disposable {
//     return this.addListener(event, listener);
//   }

//   once(event: string, listener: EventListener): Disposable {
//     return this.addListener(event, listener, { once: true });
//   }

//   emit(event: string, ...payload: any[]): boolean {
//     const listeners = this.events.get(event);
//     if (listeners && listeners.length > 0) {
//       for (const listener of listeners) {
//         listener.apply(this, ...payload);
//       }
//       return true;
//     }

//     return false;
//   }
// }
