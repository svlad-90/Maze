using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_WeaponBase;

namespace Maze_WeaponTarget
{
    public class WeaponTarget : Maze_WeaponBase.WeaponBase
    {
        [SerializeField]
        private GameObject mTarget;
        public GameObject Target { get => mTarget; set => mTarget = value; }
        override protected void actualFire()
        {
            var bullet = this.createBullet();

            if (null != bullet)
            {
                bullet.transform.parent = transform.parent;

                var bulletComponent = bullet.GetComponent<Maze_BulletBase.BulletBase>();

                if (null != bulletComponent)
                {
                    bulletComponent.Layer = Layer;
                    bulletComponent.BulletTimeAlive = this.BulletTimeAlive;
                    bulletComponent.BulletSpeed = this.BulletSpeed;

                    if (null != this.mTarget)
                    {
                        var targetPosWorldCoord = this.mTarget.transform.position;
                        var nodeWorldCoord = this.transform.position;

                        Vector2 bulletFlyingVec = new Vector2();

                        bulletFlyingVec.x = targetPosWorldCoord.x - nodeWorldCoord.x;
                        bulletFlyingVec.y = targetPosWorldCoord.y - nodeWorldCoord.y;

                        bulletFlyingVec.Normalize();

                        bulletComponent.fire(bullet.transform.TransformPoint(this.transform.localPosition), bulletFlyingVec, this.Damage);
                    }
                }
            }
        }
    }
}