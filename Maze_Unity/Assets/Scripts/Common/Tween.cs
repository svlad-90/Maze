using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Maze_Tween
{
    public class Tween<T>
    {
        public delegate void UpdateCallback(T initialValue, T targetValue, float duration, float durationPassed);
        public delegate void FinishCallback();
        private T mInitialValue;
        private T mTargetValue;
        private float mDuration;
        private float mDurationPassed = 0;
        private UpdateCallback mUpdateCallback;
        private FinishCallback mFinishCallback;
        
        private bool mIsStarted = false;
        public bool IsStarted { get => mIsStarted; set => mIsStarted = value; }

        private bool mIsFinished = false;
        public bool IsFinished { get => mIsFinished; }

        public void Start(T initialValue, T targetValue, float duration, UpdateCallback updateCallback, FinishCallback finishCallback)
        {
            Stop();
            
            mInitialValue = initialValue;
            mTargetValue = targetValue;
            mDuration = duration;
            mUpdateCallback = updateCallback;
            mFinishCallback = finishCallback;
            mIsStarted = true;
            mIsFinished = false;
        }

        public void Stop()
        {
            mIsStarted = false;
            mIsFinished = true;
            mDurationPassed = 0;
        }

        public void Restart()
        {
            mDurationPassed = 0;
            mIsFinished = false;
        }

        public void Update(float deltaTime)
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
                mIsFinished = true;

                if (null != mFinishCallback)
                {
                    mFinishCallback();
                }
            }
        }
    }
}
