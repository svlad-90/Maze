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
            this.mPlayerPosition = playerPosition;
            this.mPlayer = player;
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
                    this.mCursorPlayerGridPositionSubject.notify(new CursorPlayerGridPositionContext(this.mGridPosition, this));
                }
            }
        }

        private Maze_Observer.Subject<CursorPlayerGridPositionContext> mCursorPlayerGridPositionSubject = new Maze_Observer.Subject<CursorPlayerGridPositionContext>();
        public Subject<CursorPlayerGridPositionContext> CursorPlayerGridPositionSubject 
        { get => mCursorPlayerGridPositionSubject; }

        public new void Start()
        {
            base.Start();
            this.mEasyReference = new Maze_EasyReference.EasyReference(this.gameObject);
        }

        private Vector3 getMovementVec()
        {
            Vector3 direction = new Vector3(0,0,0);

            Vector3 movementVec = new Vector3();

            foreach(var element in this.MoveDirections) 
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
            movementVec.Scale( new Vector3(this.mAcceleration * this.mWalkForce, this.mAcceleration * this.mWalkForce, 0) );

            return movementVec;
        }

        public void Update()
        {
            if (mRigidBody != null)
            {
                if (0 != this.mMoveDirections.Count)
                {
                    if (mRigidBody.velocity.x < this.mVelocityMax ||
                    mRigidBody.velocity.x > -this.mVelocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x *= Time.deltaTime;
                        movementVec.y = 0;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }

                    if (mRigidBody.velocity.y < this.mVelocityMax ||
                    mRigidBody.velocity.y > -this.mVelocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x = 0;
                        movementVec.y *= Time.deltaTime;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }
                }
            }

            if (null != mEasyReference)
            {
                var mousePosWorldCoord = this.mEasyReference.GetMousePosition();

                var nodeWorldCoord = this.gameObject.transform.position;

                Vector2 lookAtVec = new Vector2();

                lookAtVec.x = mousePosWorldCoord.x - nodeWorldCoord.x;
                lookAtVec.y = mousePosWorldCoord.y - nodeWorldCoord.y;

                var eyeDirection2D = new Vector2(mEyesDirection.x, mEyesDirection.y);
                float angleDeg = Common.signAngle(eyeDirection2D, lookAtVec);

                this.gameObject.transform.eulerAngles = new Vector3(0, 0, angleDeg);
            }
        }
    }
}