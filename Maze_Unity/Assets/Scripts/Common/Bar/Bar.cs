using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace Maze_Bar
{
    public class Bar : MonoBehaviour
    {
        [SerializeField]
        private Slider mSlider;

        [SerializeField]
        private Gradient mGradient;

        [SerializeField]
        private Image mFill;

        public void SetValue(float val)
        {
            if (null != mSlider)
            {
                mSlider.value = val;
            }

            if (null != mGradient && null != mFill)
            {
                mFill.color = mGradient.Evaluate(mSlider.normalizedValue);
            }
        }

        public void SetMaxValue(float val)
        {
            if (null != mSlider)
            {
                mSlider.maxValue = val;
                mSlider.value = val;

                if (null != mGradient && null != mFill)
                {
                    mFill.color = mGradient.Evaluate(1f);
                }
            }
        }
    }
}