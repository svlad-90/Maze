
import { _decorator, Component, Node, SpotLight, sp } from 'cc';
const { ccclass, property } = _decorator;

namespace Maze_SpineTorch
{
    @ccclass('SpineTorch')
    export class SpineTorch extends Component 
    {
        @property 
        targetBone:string = "";

        @property
        luminousPower: number = 1;
 
        @property
        luminance: number = 1;
        
        @property
        term: number = 1;
        
        @property 
        size: number = 100;
        
        @property
        range: number = 100;
        
        @property
        spotAngle: number = 100;
        
        private _spotLight:SpotLight|null = null;

        public set enabled(val:boolean)
        {
            if(null != this._spotLight)
            {
                this._spotLight.enabled = val;
            }
        }
        public get enabled() : boolean
        {
            if(null != this._spotLight)
            {
                return this._spotLight.enabled;
            }

            return false;
        }

        start() 
        {
            this.node.addComponent(SpotLight);

            this._spotLight = this.node.getComponent(SpotLight);

            if(null != this._spotLight)
            {
                this._spotLight.node = this.node;

                this._spotLight.luminousPower = this.luminousPower;
                this._spotLight.luminance = this.luminance;
                this._spotLight.term = this.term;
                this._spotLight.size = this.size;
                this._spotLight.range = this.range;
                this._spotLight.spotAngle = this.spotAngle;

                this._spotLight.enabled = true;
            }

            var spineComp = this.node.getComponent(sp.Skeleton);

            if(null != spineComp)
            {
                var newSocket = new sp.SpineSocket();
                newSocket.path = this.targetBone;

                if(null != this._spotLight)
                {
                    newSocket.target = this._spotLight.node;
                }
                
                spineComp.sockets.push( newSocket );
            }
        }
    }
}