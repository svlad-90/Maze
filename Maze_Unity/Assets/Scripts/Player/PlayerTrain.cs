using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_Common;
using Maze_PlayerBase;

namespace Maze_PlayerTrain
{
    public class PlayerTrain : Maze_PlayerBase.PlayerBase
    {
        [SerializeField]
        float mRrotationSpeed = 10;
        public float RrotationSpeed { get => mRrotationSpeed; set => mRrotationSpeed = value; }

        private Vector3 getMovementVec()
        {
            var movementVec = new Vector3();

            foreach(var element in this.mMoveDirections)
            {
                switch (element)
                {
                    case Maze_PlayerBase.eMoveDirection.LEFT:
                        // do nothing
                        break;
                    case Maze_PlayerBase.eMoveDirection.RIGHT:
                        // do nothing
                        break;
                    case Maze_PlayerBase.eMoveDirection.UP:
                        {
                            Vector3 direction = this.Direction;
                            movementVec.x += direction.x * this.mAcceleration * this.mWalkForce;
                            movementVec.y += direction.y * this.mAcceleration * this.mWalkForce;
                        }
                        break;
                    case Maze_PlayerBase.eMoveDirection.DOWN:
                        {
                            Vector3 direction = this.Direction;
                            movementVec.x -= direction.x * this.mAcceleration * this.mWalkForce;
                            movementVec.y -= direction.y * this.mAcceleration * this.mWalkForce;
                            break;
                        }
                }
            }

            return movementVec;
        }

        // Start is called before the first frame update
        new void Start()
        {
            base.Start();
        }

        // Update is called once per frame
        void Update()
        {
            var deltaTime = Time.deltaTime;

            if (mRigidBody != null)
            {
                if (0 != this.mMoveDirections.Count)
                {
                    if (mRigidBody.velocity.x < this.mVelocityMax ||
                    mRigidBody.velocity.x > -this.mVelocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x *= deltaTime;
                        movementVec.y = 0;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }

                    if (mRigidBody.velocity.y < this.mVelocityMax ||
                    mRigidBody.velocity.y > -this.mVelocityMax)
                    {
                        var movementVec = this.getMovementVec();
                        movementVec.x = 0;
                        movementVec.y *= deltaTime;
                        mRigidBody.AddForce(Common.toVec2(movementVec));
                    }
                }
            }

            float rotationAngle = 0;

            foreach(var element in this.mMoveDirections)
            {
                switch (element)
                {
                    case Maze_PlayerBase.eMoveDirection.LEFT:
                        rotationAngle += this.mRrotationSpeed * deltaTime;
                        break;
                    case Maze_PlayerBase.eMoveDirection.RIGHT:
                        rotationAngle -= this.mRrotationSpeed * deltaTime;
                        break;
                    case Maze_PlayerBase.eMoveDirection.UP:
                    case Maze_PlayerBase.eMoveDirection.DOWN:
                            // do nothing
                            break;
                }
            }

            var newEulerAngles = transform.eulerAngles;
            newEulerAngles.z += rotationAngle;
            transform.eulerAngles = newEulerAngles;
        }
    }
}