import { TERRAIN_HEIGHT_BASE } from "cc";

export namespace Maze_Observer
{
    enum ePendingObserverAction
    {
        ADD = 0,
        DELETE = 1
    }

    class PendingObserver<T>
    {
        pendingObserverAction:ePendingObserverAction;
        observer:Observer<T>;

        constructor(pendingObserverAction:ePendingObserverAction, observer:Observer<T>)
        {
            this.pendingObserverAction = pendingObserverAction;
            this.observer = observer;
        }
    }

    export class Subject<T>
    {
        private _insideNotification:boolean = false;

        private _pendingObservers: Set<PendingObserver<T>> = new Set<PendingObserver<T>>();
        
        private observers: Set<Observer<T>> = new Set<Observer<T>>();

        public attach(observer: Observer<T>): void
        {
            if(false == this._insideNotification)
            {
                this.observers.add(observer);
            }
            else
            {
                this._pendingObservers.add( new PendingObserver<T>(ePendingObserverAction.ADD, observer));
            }
        }

        public detach(observer: Observer<T>): void 
        {
            if(false == this._insideNotification)
            {
                this.observers.delete(observer);
            }
            else
            {
                this._pendingObservers.add( new PendingObserver<T>(ePendingObserverAction.DELETE, observer));
            }
        }

        public notify(data:T): void 
        {
            this._insideNotification = true;

            for (const observer of this.observers)
            {
                observer.update(data);
            }

            this._insideNotification = false;

            for(var pendingObserverItem of this._pendingObservers)
            {
                switch(pendingObserverItem.pendingObserverAction)
                {
                    case ePendingObserverAction.ADD:
                        this.observers.add(pendingObserverItem.observer);
                        break;
                    case ePendingObserverAction.DELETE:
                        this.observers.delete(pendingObserverItem.observer);
                        break;
                }

                this._pendingObservers.clear();
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