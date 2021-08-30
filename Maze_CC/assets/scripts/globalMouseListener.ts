
import { _decorator, Component, systemEvent, SystemEvent, Vec3, EventMouse } from 'cc';
const { ccclass, property } = _decorator;

export namespace Maze_GlobalMouseListener
{
    @ccclass('GlobalMouseListener')
    export class GlobalMouseListener extends Component 
    {
        private _mousePos:Vec3 = new Vec3();
        public get mousePos() : Vec3
        {
            return this._mousePos;
        }

        start () 
        {
            systemEvent.on(SystemEvent.EventType.MOUSE_MOVE, this.onMouseMove, this);
        }

        private onMouseMove(event: EventMouse)
        {
            var screenLocation = event.getLocation();
            this.mousePos.x = screenLocation.x;
            this.mousePos.y = screenLocation.y;
        }
    }
}