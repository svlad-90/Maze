using System.Collections.Generic;

namespace Maze_FSM
{
    public delegate void FSMCallback<StateIdsEnum, Context>(Context context);

    public class TransitionMap<StateIdsEnum, TransitionIdsEnum, Context> : Dictionary<TransitionIdsEnum, Transition<StateIdsEnum, TransitionIdsEnum, Context>> { }

    public class State<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private StateIdsEnum mStateId;
        public StateIdsEnum StateId { get => mStateId; set => mStateId = value; }

        private TransitionMap<StateIdsEnum, TransitionIdsEnum, Context> mTransitionMap;
        public TransitionMap<StateIdsEnum, TransitionIdsEnum, Context> TransitionMap { get => mTransitionMap; set => mTransitionMap = value; }

        public void AddTransition(Transition<StateIdsEnum, TransitionIdsEnum, Context> val)
        {
            mTransitionMap.Add(val.TransitionId, val);
        }

        private FSMCallback<StateIdsEnum, Context> mOnEnter;
        private FSMCallback<StateIdsEnum, Context> mOnExit;

        public State(StateIdsEnum stateId, FSMCallback<StateIdsEnum, Context> onEnter, FSMCallback<StateIdsEnum, Context> onExit)
        {
            mStateId = stateId;
            mOnEnter = onEnter;
            mOnExit = onExit;
            mTransitionMap = new TransitionMap<StateIdsEnum, TransitionIdsEnum, Context>();
        }

        public void enter(Context context)
        {
            mOnEnter(context);
        }

        public void exit(Context context)
        {
            mOnExit(context);
        }
    }
    public class Transition<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private FSMCallback<StateIdsEnum, Context> mOnTransition;

        private TransitionIdsEnum mTransitionId;
        public TransitionIdsEnum TransitionId { get => mTransitionId; }

        private State<StateIdsEnum, TransitionIdsEnum, Context>  mStartState;
        private State<StateIdsEnum, TransitionIdsEnum, Context>  mEndState;

        public Transition(TransitionIdsEnum transitionId,
                State<StateIdsEnum, TransitionIdsEnum, Context>  startState,
                State<StateIdsEnum, TransitionIdsEnum, Context>  endState,
                FSMCallback<StateIdsEnum, Context>  onTransition = null)
        {
            mTransitionId = transitionId;
            mStartState = startState;
            mEndState = endState;
            mOnTransition = onTransition;
        }

        public State<StateIdsEnum, TransitionIdsEnum, Context>  applyTransition(Context context)
        {
            if (mStartState != mEndState)
            {
                mStartState.exit(context);
                mEndState.enter(context);
            }

            if (null != mOnTransition)
            {
                mOnTransition(context);
            }

            return mEndState;
        }
    }

    public class FSM<StateIdsEnum, TransitionIdsEnum, tContext > where tContext : new()
    {
        private bool mInitialized = false;
        public bool Initialized { get => mInitialized; }

        private State<StateIdsEnum, TransitionIdsEnum, tContext>  mInitialState;
        
        private State<StateIdsEnum, TransitionIdsEnum, tContext>  mCurrentState;
        internal State<StateIdsEnum, TransitionIdsEnum, tContext> CurrentState { get => mCurrentState; set => mCurrentState = value; }

        private tContext mContext;
        public tContext Context { get => mContext; set => mContext = value; }

        public FSM(State<StateIdsEnum, TransitionIdsEnum, tContext> initialState)
        {
            mInitialState = initialState;
            mCurrentState = mInitialState;
            mContext = new tContext();
        }

        // takes effect only if init was already called
        public void restart()
        {
            if (true == mInitialized)
            {
                mContext = new tContext();
                mCurrentState = mInitialState;
                mCurrentState.enter(mContext);
            }
        }

        public void init()
        {
            if (false == mInitialized)
            {
                mInitialized = true;
                mCurrentState.enter(mContext);
            }
        }

        public void ApplyTransition(TransitionIdsEnum transitionId)
        {
            if (true == mInitialized)
            {
                Transition<StateIdsEnum, TransitionIdsEnum, tContext> foundTransition;
                if (mCurrentState.TransitionMap.TryGetValue(transitionId, out foundTransition))
                {
                    mCurrentState = foundTransition.applyTransition(mContext);
                }
            }
            else
            {
                throw new System.Exception("FSM is not initialized!");
            }
        }
    }
}