export namespace Maze_FSM
{
    export type FSMCallback<StateIdsEnum, Context> = (context:Context) => void;
    type TransitionMap<StateIdsEnum, TransitionIdsEnum, Context> = Map<TransitionIdsEnum, Transition<StateIdsEnum, TransitionIdsEnum, Context>>;

    export class State<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private _stateId:StateIdsEnum;
        public get stateId() : StateIdsEnum
        {
            return this._stateId;
        }

        private _transitionMap:TransitionMap<StateIdsEnum, TransitionIdsEnum, Context>;
        public get transitionMap() : TransitionMap<StateIdsEnum, TransitionIdsEnum, Context>
        {
            return this._transitionMap;
        }
        public set transitionMap(val:TransitionMap<StateIdsEnum, TransitionIdsEnum, Context>)
        {
            this._transitionMap = val;
        }

        addTransition(val:Transition<StateIdsEnum, TransitionIdsEnum, Context>)
        {
            this._transitionMap.set(val.transitionId, val);
        }

        private _onEnter : FSMCallback<StateIdsEnum, Context>;
        private _onExit : FSMCallback<StateIdsEnum, Context>;

        constructor(stateId:StateIdsEnum, onEnter:FSMCallback<StateIdsEnum, Context>, onExit:FSMCallback<StateIdsEnum, Context>)
        {
            this._stateId = stateId;
            this._onEnter = onEnter;
            this._onExit = onExit;
            this._transitionMap = new Map<TransitionIdsEnum, Transition<StateIdsEnum, TransitionIdsEnum, Context>>();
        }

        public enter(context:Context)
        {
            this._onEnter(context);
        }

        public exit(context:Context)
        {
            this._onExit(context);
        }
    }

    export class Transition<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private _onTransition:FSMCallback<StateIdsEnum, Context>;
        
        private _transitionId:TransitionIdsEnum;
        public get transitionId() : TransitionIdsEnum
        {
            return this._transitionId;
        }

        private _startState:State<StateIdsEnum, TransitionIdsEnum, Context>;
        private _endState:State<StateIdsEnum, TransitionIdsEnum, Context>;

        constructor(transitionId:TransitionIdsEnum, 
                    startState:State<StateIdsEnum, TransitionIdsEnum, Context>, 
                    endState:State<StateIdsEnum, TransitionIdsEnum, Context>,
                    onTransition:FSMCallback<StateIdsEnum, Context> = (context:Context)=>{})
        {
            this._transitionId = transitionId;
            this._startState = startState;
            this._endState = endState;
            this._onTransition = onTransition;
        }

        public applyTransition(context:Context) : State<StateIdsEnum, TransitionIdsEnum, Context>
        {
            if(this._startState != this._endState)
            {
                this._startState.exit(context);
                this._endState.enter(context);
            }

            this._onTransition(context);

            return this._endState;
        }
    }

    export class FSM<StateIdsEnum, TransitionIdsEnum, Context>
    {
        private _initialized = false;
        public get initialized()
        {
            return this._initialized;
        }

        private _initialState:State<StateIdsEnum, TransitionIdsEnum, Context>;

        private _currentState:State<StateIdsEnum, TransitionIdsEnum, Context>;
        public get currentState() : StateIdsEnum
        {
            return this._currentState.stateId;
        }
        
        private _context:Context;
        public get context() : Context
        {
            return this._context;
        }
        public set context(val:Context)
        {
            this._context = val;
        }

        constructor( initialState:State<StateIdsEnum, TransitionIdsEnum, Context>, context:Context )
        {
            this._initialState = initialState;
            this._currentState = this._initialState;
            this._context = context;
        }

        init()
        {
            if(false == this._initialized)
            {
                this._initialized = true;
                this._currentState.enter(this._context);
            }
        }

        public applyTransition(transitionId:TransitionIdsEnum)
        {
            if(true == this._initialized)
            {
                var foundTransition = this._currentState.transitionMap.get(transitionId);

                if(null != foundTransition)
                {
                    this._currentState = foundTransition.applyTransition(this._context);
                }
            }
            else
            {
                throw Error("FSM is not initialized!");
            }
        }
    }
}
