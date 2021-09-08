using Maze_Observer;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_Common;

namespace Maze_PlayerCursor
{
    public class CursorPlayerGridPositionContext
    {
        public CursorPlayerGridPositionContext(Vector2 playerPosition, Maze_PlayerCursor.PlayerCursor player )
        {
            mPlayerPosition = playerPosition;
            mPlayer = player;
        }

        private Vector2 mPlayerPosition;
        public Vector2 PlayerPosition { get => mPlayerPosition; set => mPlayerPosition = value; }

        private Maze_PlayerCursor.PlayerCursor mPlayer;
        public PlayerCursor Player { get => mPlayer; set => mPlayer = value; }
    }

    public class PlayerCursor : Maze_PlayerBase.PlayerBase
    {
        private Maze_EasyReference.EasyReference mEasyReference;

        private Vector2 mGridPosition = new Vector2(0, 0);
        public Subject<Vector2> GridPosition
        {
            get => GridPosition;
            protected set
            {
                if (false == GridPosition.Equals(value))
                {
                    GridPosition = value;
                    mCursorPlayerGridPositionSubject.notify(new CursorPlayerGridPositionContext(mGridPosition, this));
                }
            }
        }

        private Maze_Observer.Subject<CursorPlayerGridPositionContext> mCursorPlayerGridPositionSubject = new Maze_Observer.Subject<CursorPlayerGridPositionContext>();
        public Subject<CursorPlayerGridPositionContext> CursorPlayerGridPositionSubject 
        { get => mCursorPlayerGridPositionSubject; }

        public new void Start()
        {
            base.Start();
            mEasyReference = new Maze_EasyReference.EasyReference(gameObject);
        }

        private Vector3 getMovementVec()
        {
            Vector3 direction = new Vector3(0,0,0);

            Vector3 movementVec = new Vector3();

            foreach(var element in MoveDirections) 
            {
                switch(element)
                {
                case Maze_PlayerBase.eMoveDirection.LEFT:
                        movementVec.x -= 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.RIGHT:
                        movementVec.x += 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.UP:
                        movementVec.y += 1;
                    break;
                case Maze_PlayerBase.eMoveDirection.DOWN:
                        movementVec.y -= 1;
                    break;
                }
            };

            movementVec.Normalize();
            movementVec.Scale( new Vector3(mAcceleration * mWalkForce, mAcceleration * mWalkForce, 0) );

            return movementVec;
        }

        public void Update()
        {
            if (mRigidBody != null)
            {
                if (0 != mMoveDirections.Count)
                {
                    if (mRigidBody.velocity.x < mVelocityMax ||
                    mRigidBody.velocity.x > -mVelocityMax)
                    {
                        var movementVec = getMovementVec();
                        movementVec.x *= Time.deltaTime;
                        movementVec.y = 0;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }

                    if (mRigidBody.velocity.y < mVelocityMax ||
                    mRigidBody.velocity.y > -mVelocityMax)
                    {
                        var movementVec = getMovementVec();
                        movementVec.x = 0;
                        movementVec.y *= Time.deltaTime;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }
                }
            }

            if (null != mEasyReference)
            {
                var mousePosWorldCoord = mEasyReference.GetMousePosition();

                var nodeWorldCoord = gameObject.transform.position;

                Vector2 lookAtVec = new Vector2();

                lookAtVec.x = mousePosWorldCoord.x - nodeWorldCoord.x;
                lookAtVec.y = mousePosWorldCoord.y - nodeWorldCoord.y;

                var eyeDirection2D = new Vector2(mEyesDirection.x, mEyesDirection.y);
                float angleDeg = Common.signAngle(eyeDirection2D, lookAtVec);

                gameObject.transform.eulerAngles = new Vector3(0, 0, angleDeg);
            }
        }
    }
}