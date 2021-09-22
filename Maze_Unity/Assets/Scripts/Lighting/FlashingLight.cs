using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Experimental.Rendering.Universal;
using Maze_Tween;

namespace Maze_FlashingLight
{
    public class FlashingLight : MonoBehaviour
    {
        private Light2D mLight;
        private Tween<int> mIntencityTween;

        FlashingLight()
        {
            mIntencityTween = new Tween<int>();
        }

        private void startFallingIntencity()
        {
            mIntencityTween.Start(1, 0, 1,
            (int initialValue, int targetValue, float duration, float durationPassed) =>
            {
                if (null != mLight)
                {
                    mLight.intensity = initialValue + ((targetValue - initialValue) * (durationPassed / duration));
                }
            },
            () =>
            {
                if (null != mLight)
                {
                    mLight.intensity = 0;
                    startRisingIntencity();
                }
            },
            () =>
            {
                if (null != mLight)
                {
                    mLight.intensity = 0;
                }
            });
        }
        private void startRisingIntencity()
        {
            mIntencityTween.Start(0, 1, 1,
            (int initialValue, int targetValue, float duration, float durationPassed) =>
            {
                if (null != mLight)
                {
                    mLight.intensity = initialValue + ((targetValue - initialValue) * (durationPassed / duration));
                }
            },
            () =>
            {
                if (null != mLight)
                {
                    mLight.intensity = 1;
                    startFallingIntencity();
                }
            },
            () =>
            {
                if (null != mLight)
                {
                    mLight.intensity = 1;
                }
            });
        }

        public void Start()
        {
            if (null == GetComponent<Light2D>())
            {
                gameObject.AddComponent<Light2D>();
            }

            mLight = GetComponent<Light2D>();

            startFallingIntencity();
        }

        void Update()
        {
            if(null != mIntencityTween)
            {
                mIntencityTween.Update(Time.deltaTime);
            }
        }
    }
}