import { assert } from "cc";

export namespace Maze_DoubleLinkedList
{
    export class ListValue<T>
    {
        public value:T|null;

        constructor(value:T|null)
        {
            this.value = value;
        }
    }

    export interface IList<T> 
    {
        add(value: T): void;//Add element
        insert(at: ListValue<T>, value: T): void;//Insert element
        remove(value: ListValue<T>): void;//Remove element
        head(): ListValue<T>|null;//Return head element
        tail(): ListValue<T>|null;//Return the tail element
        find(value: T): ListValue<T>|null;//Find element
        reverse_find(value: T): ListValue<T>|null;//Find elements in reverse
        size(): number;//Return the number of list elements
        empty(): boolean;//Is the list empty
        clear(): void;//clear the list
    }

    class ListItem<T>
    {
        private _name: string;
        private _valueItem: ListValue<T>;//value
        private _prev: ListItem<T>|null;//Point to the previous element
        private _next: ListItem<T>|null;//Point to the next element

        constructor(value: T|null)
        {
            this._name = value + '';
            this._valueItem = new ListValue<T>(value);
            this._prev = null;
            this._next = null;
        }
        set name(name: string)
        {
            this._name = name;
        }
        
        get name(): string
        {
            return this._name;
        }
        
        set valueItem(value:ListValue<T>)
        {
            this._valueItem = value;
        }

        get valueItem(): ListValue<T>
        {
            return this._valueItem;
        }
        
        set prev(item: ListItem<T>|null)
        {
            this._prev = item;
        }
        
        get prev(): ListItem<T>|null
        {
            return this._prev;
        }
        
        set next(item: ListItem<T>|null)
        {
            this._next = item;
        }
        
        get next(): ListItem<T>|null
        {
            return this._next;
        }
    }

    export class DoubleLinkedList<T> implements IList<T>, Iterable<ListValue<T>>
    {
        private _count: number = 0;//Record the number of elements
        private _head: ListItem<T>;//Head element
        private _tail: ListItem<T>;//Tail element
        
        constructor()
        {
            this._head = new ListItem<T>(null);
            this._head.name = 'head';
            this._tail = new ListItem<T>(null);
            this._tail.name = 'tail';
            this._head.prev = this._head.next = this._tail;
            this._tail.next = this._tail.prev = this._head;
        }
        
        add(value: T)
        {
            var item = new ListItem<T>(value);
            item.prev = this._tail.prev;
            item.next = this._tail;
            this._tail.prev = item;

            if(null != item.prev)
            {
                item.prev.next = item;
            }
            else
            {
                throw Error("item.prev == null");
            }

            this._count++;
        }

        insert(at: ListValue<T>, value: T)
        {
            if (this.empty())
            {
                return;
            }

            var indexItem = this._head.next;
            while(indexItem !== this._tail)
            {
                if(null != indexItem)
                {
                    if (indexItem.valueItem == at)
                    {
                        var valueItem = new ListItem<T>(value);
                        valueItem.prev = indexItem;
                        valueItem.next = indexItem.next;

                        if(null != indexItem.next)
                        {
                            indexItem.next.prev = valueItem;
                        }
                        else
                        {
                            throw Error("indexItem.next == null");
                        }

                        indexItem.next = valueItem;
                        this._count++;
                        break;
                    }
                    indexItem = indexItem.next;
                }
                else
                {
                    throw Error("indexItem == null");
                }
            }
        }

        get(at: number):ListValue<T>
        {
            if (this.empty())
            {
                return new ListValue<T>(null);
            }

            if(at >= this.size())
            {
                return new ListValue<T>(null);
            }

            var counter = 0;

            var indexItem = this._head.next;

            while(counter < at && indexItem !== this._tail)
            {
                if(null != indexItem)
                {
                    indexItem = indexItem.next;
                }
                else
                {
                    throw Error("indexItem == null");
                }
            }
        

            if(null != indexItem)
            {
                return indexItem.valueItem;
            }
            else
            {
                throw Error("indexItem == null");
            }
        }

        remove(value: ListValue<T>): ListValue<T>
        {
            if (this.empty())
            {
                return new ListValue<T>(null);
            }

            var indexItem = this._head.next;
            
            while(indexItem !== this._tail)
            {
                if(null != indexItem)
                {
                    if (indexItem.valueItem == value)
                    {
                        if(null != indexItem.prev)
                        {
                            indexItem.prev.next = indexItem.next;
                        }
                        else
                        {
                            throw Error("indexItem.prev == null");
                        }

                        if(null != indexItem.next)
                        {
                            indexItem.next.prev = indexItem.prev;
                        }
                        else
                        {
                            throw Error("indexItem.next == null");
                        }                        
    
                        indexItem.next = new ListItem<T>(null);
                        indexItem.prev = new ListItem<T>(null);
                        var value = indexItem.valueItem;
                        indexItem.valueItem = new ListValue<T>(null);
                        indexItem = new ListItem<T>(null);
                        this._count--;
                        return value;
                    }
                    indexItem = indexItem.next;
                }
                else
                {
                    throw Error("indexItem == null");
                }
            }

            return new ListValue<T>(null);
        }

        head(): ListValue<T>
        {
            if(null != this._head)
            {
                if(null != this._head.next)
                {
                    return this._head.next.valueItem;
                }
                else
                {
                    throw Error("this._head.next == null");
                }
            }
            else
            {
                throw Error("this._head == null");
            }   
        }

        tail(): ListValue<T>
        {
            if(null != this._tail)
            {
                if(null != this._tail.prev)
                {
                    return this._tail.prev.valueItem;
                }
                else
                {
                    throw Error("this._tail.prev == null");
                }
            }
            else
            {
                throw Error("this._tail == null");
            }   
        }

        find(value: T): ListValue<T>
        {
            if (this.empty())
            {
                return new ListValue<T>(null);
            }
            
            var indexItem = this._head.next;

            while(indexItem !== this._tail)
            {
                if(null != indexItem)
                {
                    if (indexItem.valueItem.value == value)
                    {
                        return indexItem.valueItem;
                    }
                    
                    indexItem = indexItem.next;
                }
                else
                {
                    throw Error("indexItem == null");
                } 
            }
            
            return new ListValue<T>(null);
        }

        reverse_find(value: T): ListValue<T>
        {
            if (this.empty())
            {
                return new ListValue<T>(null);
            }

            var indexItem = this._tail.prev;
            
            while(indexItem !== this._head)
            {
                if(null != indexItem)
                {
                    if (indexItem.valueItem.value == value)
                    {
                        return indexItem.valueItem;
                    }
                    
                    indexItem = indexItem.prev;
                }
                else
                {
                    throw Error("indexItem == null");
                }
            }

            return new ListValue<T>(null);
        }

        size(): number 
        {
            return this._count;
        }

        empty(): boolean
        {
            return this._count === 0;
        }

        clear(): void
        {
            var item = this._head.next;
            while(item !== this._tail)
            {
                if(null != item)
                {
                    item.prev = new ListItem<T>(null);
                    item.valueItem = new ListValue<T>(null);
                    item = item.next;

                    if(null != item)
                    {
                        if(null != item.prev)
                        {
                            item.prev.next = new ListItem<T>(null);
                        }
                        else
                        {
                            throw Error("item.prev == null");
                        }
                    }
                    else
                    {
                        throw Error("item == null");
                    }
                }
                else
                {
                    throw Error("item == null");
                }
            }
            this._head.next = this._tail;
            this._tail.prev = this._head;
            this._count = 0;
        }

        print()
        {
            var item = this._head.next;
            while(item !== this._tail)
            {
                console.log(item);

                if(null != item)
                {
                    item = item.next;
                }
                else
                {
                    throw Error("item == null");
                }
            }
        }

        *iterator(): IterableIterator<ListValue<T>> 
        {
            var currentItem:ListItem<T>|null = this._head.next;

            while(currentItem != this._tail) 
            {
                if(null != currentItem)
                {
                    yield currentItem.valueItem;

                    if(null != currentItem)
                    {
                        currentItem = currentItem.next;
                    }
                }
                else
                {
                    throw Error("currentItem == null");
                }
            }
        }

        [Symbol.iterator]()
        {
            return this.iterator();
        }

        clone():DoubleLinkedList<T>
        {
            var result:DoubleLinkedList<T> = new DoubleLinkedList<T>();

            for(var element of this)
            {
                if(null != element.value)
                {
                    result.add(element.value);
                }
            }

            return result;
        }
    }
}