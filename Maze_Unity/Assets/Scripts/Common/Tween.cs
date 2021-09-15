using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Maze_Tween
{
    public class Tween<T>
    {
        enum eState
        { 
            Idle = 0,
            Running,
            Finished,
            Stopped
        }

        public delegate void UpdateCallback(T initialValue, T targetValue, float duration, float durationPassed);
        public delegate void FinishCallback();
        public delegate void StopCallback();
        private T mInitialValue;
        private T mTargetValue;
        private float mDuration;
        private float mDurationPassed = 0;
        private UpdateCallback mUpdateCallback;
        private FinishCallback mFinishCallback;
        private StopCallback mStopCallback;

        private eState mState = eState.Idle;
        public bool IsRunning { get => mState == eState.Running; }
        public bool IsFinished { get => mState == eState.Finished; }
        public bool IsStopped { get => mState == eState.Stopped; }

        public void Start(T initialValue, T targetValue, float duration, UpdateCallback updateCallback, FinishCallback finishCallback = null, StopCallback stopCallback = null)
        {            
            mInitialValue = initialValue;
            mTargetValue = targetValue;
            mDuration = duration;
            mDurationPassed = 0;
            mUpdateCallback = updateCallback;
            mFinishCallback = finishCallback;
            mStopCallback = stopCallback;
            mState = eState.Running;
        }

        public void Stop()
        {
            if (mState == eState.Running)
            {
                mState = eState.Stopped;

                if (null != mStopCallback)
                {
                    mStopCallback();
                }
            }
            else
            {
                mState = eState.Stopped;
            }

            mDurationPassed = 0;
        }

        public void Restart()
        {
            mDurationPassed = 0;
            mState = eState.Running;
        }

        public void Update(float deltaTime)
        {
            if (mState == eState.Running)
            {
                mDurationPassed += deltaTime;

                if (mDurationPassed > mDuration)
                {
                    mDurationPassed = mDuration;
                }

                if (null != mUpdateCallback)
                {
                    mUpdateCallback(mInitialValue, mTargetValue, mDuration, mDurationPassed);
                }

                if (mDurationPassed >= mDuration)
                {
                    mState = eState.Finished;

                    if (null != mFinishCallback)
                    {
                        mFinishCallback();
                    }
                }
            }
        }
    }
}
