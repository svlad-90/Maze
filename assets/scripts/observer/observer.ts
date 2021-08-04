export namespace Maze_Observer
{
    export class Subject<T>
    {
        private observers: Set<Observer<T>> = new Set<Observer<T>>();

        public attach(observer: Observer<T>): void
        {
            this.observers.add(observer);
        }

        public detach(observer: Observer<T>): void 
        {
            this.observers.delete(observer);
        }

        public notify(data:T): void 
        {
            for (const observer of this.observers)
            {
                observer.update(data);
            }
        }
    }

    export class Observer<T>
    {
        private _callback: ((subject: T) => void) | null = null;

        setObserverCallback(callback:(subject: T)=>void)
        {
            this._callback = callback
        }

        update(data: T): void
        {
            if(null != this._callback)
            {
                this._callback(data);
            }
        }
    }
}