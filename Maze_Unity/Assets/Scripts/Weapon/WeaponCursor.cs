using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Maze_WeaponBase;

public class WeaponCursor : Maze_WeaponBase.WeaponBase
{
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

                if (null != this.mEasyReference)
                {
                    var mousePosWorldCoord = this.mEasyReference.GetMousePosition();
                    var nodeWorldCoord = this.transform.position;

                    Vector2 bulletFlyingVec = new Vector2();

                    bulletFlyingVec.x = mousePosWorldCoord.x - nodeWorldCoord.x;
                    bulletFlyingVec.y = mousePosWorldCoord.y - nodeWorldCoord.y;

                    bulletFlyingVec.Normalize();

                    bulletComponent.fire(bullet.transform.TransformPoint(this.transform.localPosition), bulletFlyingVec, this.Damage);
                }
            }
        }
    }
}