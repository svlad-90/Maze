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

        void AddTransition(Transition<StateIdsEnum, TransitionIdsEnum, Context> val)
        {
            this.mTransitionMap.Add(val.TransitionId, val);
        }

        private FSMCallback<StateIdsEnum, Context> mOnEnter;
        private FSMCallback<StateIdsEnum, Context> mOnExit;

        State(StateIdsEnum stateId, FSMCallback<StateIdsEnum, Context> onEnter, FSMCallback<StateIdsEnum, Context> onExit)
        {
            this.mStateId = stateId;
            this.mOnEnter = onEnter;
            this.mOnExit = onExit;
            this.mTransitionMap = new TransitionMap<StateIdsEnum, TransitionIdsEnum, Context>();
        }

        public void enter(Context context)
        {
            this.mOnEnter(context);
        }

        public void exit(Context context)
        {
            this.mOnExit(context);
        }
    }
    public class Transition<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private FSMCallback<StateIdsEnum, Context> mOnTransition;

        private TransitionIdsEnum mTransitionId;
        public TransitionIdsEnum TransitionId { get => mTransitionId; }

        private State<StateIdsEnum, TransitionIdsEnum, Context>  mStartState;
        private State<StateIdsEnum, TransitionIdsEnum, Context>  mEndState;

        Transition(TransitionIdsEnum transitionId,
                State<StateIdsEnum, TransitionIdsEnum, Context>  startState,
                State<StateIdsEnum, TransitionIdsEnum, Context>  endState,
                FSMCallback<StateIdsEnum, Context>  onTransition = null)
        {
            this.mTransitionId = transitionId;
            this.mStartState = startState;
            this.mEndState = endState;
            this.mOnTransition = onTransition;
        }

        public State<StateIdsEnum, TransitionIdsEnum, Context>  applyTransition(Context context)
        {
            if (this.mStartState != this.mEndState)
            {
                this.mStartState.exit(context);
                this.mEndState.enter(context);
            }

            this.mOnTransition(context);

            return this.mEndState;
        }
    }

    public class FSM<StateIdsEnum, TransitionIdsEnum, tContext>
    {
        private bool mInitialized = false;
        public bool Initialized { get => mInitialized; }

        private State<StateIdsEnum, TransitionIdsEnum, tContext>  mInitialState;
        
        private State<StateIdsEnum, TransitionIdsEnum, tContext>  mCurrentState;
        internal State<StateIdsEnum, TransitionIdsEnum, tContext> CurrentState { get => mCurrentState; set => mCurrentState = value; }

        private tContext mContext;
        public tContext Context { get => mContext; set => mContext = value; }

        FSM(State<StateIdsEnum, TransitionIdsEnum, tContext> initialState, tContext context)
        {
            this.mInitialState = initialState;
            this.mCurrentState = this.mInitialState;
            this.mContext = context;
        }

        void init()
        {
            if (false == this.mInitialized)
            {
                this.mInitialized = true;
                this.mCurrentState.enter(this.mContext);
            }
        }

        public void applyTransition(TransitionIdsEnum transitionId)
        {
            if (true == this.mInitialized)
            {
                Transition<StateIdsEnum, TransitionIdsEnum, tContext> foundTransition;
                if (this.mCurrentState.TransitionMap.TryGetValue(transitionId, out foundTransition))
                {
                    this.mCurrentState = foundTransition.applyTransition(this.mContext);
                }
            }
            else
            {
                throw new System.Exception("FSM is not initialized!");
            }
        }
    }
}