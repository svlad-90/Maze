using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Spine.Unity;

namespace Maze_PlayerBase
{
    public enum eMoveDirection
    {
        RIGHT = 0,
        LEFT = 1,
        UP = 2,
        DOWN = 3
    };

    public class PlayerBase : MonoBehaviour
    {
        protected Vector2 mEyesDirection = new Vector2(0,1);
        public Vector2 EyesDirection { get => mEyesDirection; set => mEyesDirection = value; }

        [SerializeField]
        protected float mAcceleration = 0;
        public float Acceleration { get => mAcceleration; set => mAcceleration = value; }

        [SerializeField]
        protected float mVelocityMax = 0;
        public float VelocityMax { get => mVelocityMax; set => mVelocityMax = value; }

        protected HashSet<eMoveDirection> mMoveDirections = new HashSet<eMoveDirection>();
        public HashSet<eMoveDirection> MoveDirections { get => mMoveDirections; set => mMoveDirections = value; }

        protected float mWalkForce = 200;
        public float WalkForce { get => mWalkForce; }

        protected SkeletonAnimation mSkeletonAnimation;
        protected eMoveDirection mCurrentMoveDirection = eMoveDirection.UP;

        protected Rigidbody2D mRigidBody;

        public void OnMoveUpStart()
        {
            mCurrentMoveDirection = eMoveDirection.UP;
            startMovement();
        }

        public void OnMoveUpFinish()
        {
            mMoveDirections.Remove(eMoveDirection.UP);
            finishMovement();
        }

        public void OnMoveDownStart()
        {
            mCurrentMoveDirection = eMoveDirection.DOWN;
            startMovement();
        }

        public void OnMoveDownFinish()
        {
            mMoveDirections.Remove(eMoveDirection.DOWN);
            finishMovement();
        }

        public void OnMoveLeftStart()
        {
            mCurrentMoveDirection = eMoveDirection.LEFT;
            startMovement();
        }

        public void OnMoveLeftFinish()
        {
            mMoveDirections.Remove(eMoveDirection.LEFT);
            finishMovement();
        }

        public void OnMoveRightStart()
        {
            mCurrentMoveDirection = eMoveDirection.RIGHT;
            startMovement();
        }

        public void OnMoveRightFinish()
        {
            mMoveDirections.Remove(eMoveDirection.RIGHT);
            finishMovement();
        }

        public void OnFireOn()
        {

        }

        public void OnFireOff()
        {

        }

        // Start is called before the first frame update
        public void Start()
        {
            mSkeletonAnimation = GetComponent<SkeletonAnimation>() as SkeletonAnimation;

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "idle", true);
            }

            mRigidBody = GetComponent<Rigidbody2D>();
        }

        private void startMovement()
        {
            this.mMoveDirections.Add(mCurrentMoveDirection);

            if (mSkeletonAnimation != null)
            {
                mSkeletonAnimation.state.SetAnimation(0, "run", true);
            }
        }

        private void finishMovement()
        {
            if (0 == this.mMoveDirections.Count)
            {
                if (mSkeletonAnimation != null)
                {
                    mSkeletonAnimation.state.SetAnimation(0, "idle", true);
                }
            }
        }

        void Update()
        {

        }
    }
}
