using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using Maze_Common;

namespace Maze_EasyReference
{
    public class EasyReference
    {
        private GameObject mGameObject;
        public GameObject GameObject { get => mGameObject; }

        private Camera mCamera;
        public Camera Camera { get => mCamera; }

        private RectTransform mTransform;
        public RectTransform Transform { get => mTransform; }

        public EasyReference(GameObject gameObject)
        {
            this.mGameObject = gameObject;
            this.mCamera = Camera.main;
            this.mTransform = gameObject.GetComponent<RectTransform>();
        }

        public T GetChildComponentByName<T>(GameObject gameObject, string name) where T : Component
        {
            if (null != mGameObject)
            {
                foreach (T component in gameObject.GetComponentsInChildren<T>(true))
                {
                    if (component.gameObject.name == name)
                    {
                        return component;
                    }
                }
            }

            return null;
        }


        Rect getScreenWorldCoordRect()
        {
            if(null != mCamera)
            {
                var bottomLeftPoint = Common.toVec2(this.mCamera.ScreenToWorldPoint(new Vector3(0, 0, 0)));
                var topRightPoint = Common.toVec2(this.Camera.ScreenToWorldPoint(new Vector3(Screen.width, Screen.height, 0)));
                return new Rect(bottomLeftPoint.x, bottomLeftPoint.y, topRightPoint.x - bottomLeftPoint.x, topRightPoint.y - bottomLeftPoint.y);
            }

            throw new System.Exception("[screenRectWorldCoord] Error! Some of the");
        }

        public Vector2 GetMousePosition()
        {
            if (null != this.Camera)
            {
                var mousePos = Mouse.current.position;
                return this.Camera.ScreenToWorldPoint(new Vector2(mousePos.x.ReadValue(), mousePos.y.ReadValue()));
            }

            throw new System.Exception("[getMousePosition] Error! Camera is null!");
        }
    }
}