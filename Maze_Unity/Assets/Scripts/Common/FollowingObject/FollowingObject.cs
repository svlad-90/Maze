using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Maze_FollowingObject
{
    public class FollowingObject : MonoBehaviour
    {
        [SerializeField]
        private GameObject mFollowedObject;
        public GameObject FollowedObject { get => mFollowedObject; set => mFollowedObject = value; }

        [SerializeField]
        private bool mInheritRotation = false;
        public bool InheritRotation { get => mInheritRotation; set => mInheritRotation = value; }

        // Start is called before the first frame update
        void Start()
        {

        }

        // Update is called once per frame
        void Update()
        {
            if (null != this.mFollowedObject)
            {
                var followedObjectTransform = this.mFollowedObject.transform;
                var myTransform = this.transform;

                if (followedObjectTransform != null && myTransform != null)
                {
                    var targetPosition = followedObjectTransform.position;
                    myTransform.position = new Vector3(targetPosition.x, targetPosition.y, myTransform.position.z);

                    if (true == this.mInheritRotation)
                    {
                        myTransform.rotation = followedObjectTransform.rotation;
                    }
                }
            }
        }
    }
}