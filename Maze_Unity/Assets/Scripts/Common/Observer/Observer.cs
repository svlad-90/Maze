using System.Collections;
using System.Collections.Generic;

namespace Maze_Observer
{
    public enum ePendingObserverAction
    {
        ADD = 0,
        DELETE = 1
    }

    class PendingObserver<T>
    {
        public ePendingObserverAction mPendingObserverAction;
        public Observer<T>  mObserver;

        public PendingObserver(ePendingObserverAction pendingObserverAction, Observer<T> observer)
        {
            this.mPendingObserverAction = pendingObserverAction;
            this.mObserver = observer;
        }
    }
    public class Subject<T>
    {
        private bool mInsideNotification = false;

        private HashSet<PendingObserver<T>> mPendingObservers = new HashSet<PendingObserver<T>>();
        
        private HashSet<Observer<T>> mObservers = new HashSet<Observer<T>>();

        public void attach(Observer<T>  observer)
        {
            if(false == this.mInsideNotification)
            {
                this.mObservers.Add(observer);
            }
            else
            {
                this.mPendingObservers.Add( new PendingObserver<T>(ePendingObserverAction.ADD, observer));
            }
        }

        public void detach(Observer<T> observer)
        {
            if (false == this.mInsideNotification)
            {
                this.mObservers.Remove(observer);
            }
            else
            {
                this.mPendingObservers.Add(new PendingObserver<T>(ePendingObserverAction.DELETE, observer));
            }
        }

        public void notify(T data)
        {
            this.mInsideNotification = true;

            foreach(var observer in mObservers)
            {
                observer.update(data);
            }

            this.mInsideNotification = false;

            foreach(var pendingObserverItem in this.mPendingObservers)
            {
                switch (pendingObserverItem.mPendingObserverAction)
                {
                    case ePendingObserverAction.ADD:
                        this.mObservers.Add(pendingObserverItem.mObserver);
                        break;
                    case ePendingObserverAction.DELETE:
                        this.mObservers.Remove(pendingObserverItem.mObserver);
                        break;
                }
            }

            this.mPendingObservers.Clear();
        }
    }

    public class Observer<T>
    {
        public delegate void ObserverCallback(T subject);
        ObserverCallback mCallback;

        public void setObserverCallback(ObserverCallback callback)
        {
            this.mCallback = callback;
        }

        public void update(T data)
        {
            if (null != this.mCallback)
            {
                this.mCallback(data);
            }
        }
    }
}