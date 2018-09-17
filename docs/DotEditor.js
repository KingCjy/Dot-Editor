(function(window) {
    var DotEditor = function(datas) {}
    DotEditor.prototype.init = function(datas) {
        this.canvas = document.createElement('canvas');
        document.getElementById(datas.id).appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');

        this.jsonArea = document.getElementById(datas.json);
        this.layerArea = document.getElementById(datas.layer);

        this.width = datas.width;
        this.height = datas.height;
        this.canvas.width = datas.width + 50;
        this.canvas.height = datas.height + 50;
        this.row = datas.row;
        this.col = datas.col;

        this.pointList = new Array();
        this.layerList = new Array();

        this.layerIndex = 0;
        this.addLayer();

        this.mode = 'line';

        this.p1 = null;
        this.p2 = null;
        this.mousePoint = null;

        this.drawFrame();

        var x_distance = this.width/this.col;
        var y_distance = this.height/this.row;

        for(var i = 0; i < this.row; i++) {
            for(var j = 0; j < this.col; j++) {
                var point = new Point((j)*x_distance+(x_distance/2), (i)*y_distance+(y_distance/2), i, j);
                this.pointList.push(point);
                this.drawPoint(point);
            }
        }

        this.canvas.addEventListener('click', this.click.bind(this));
        this.canvas.addEventListener('mousemove', this.move.bind(this));
        return this;
    }
    DotEditor.prototype.destroy = function() {
        this.canvas.parentElement.removeChild(this.canvas);
        while (this.layerArea.firstChild) {
            this.layerArea.removeChild(this.layerArea.firstChild);
        }
    }
    DotEditor.prototype.changeMode = function(mode) {
        this.mode = mode;

        this.p1 = null;
        this.p2 = null;
        this.draw();
    }
    DotEditor.prototype.addLayer = function() {
        var layer = document.createElement('div');
        layer.classList.add('layer');
        layer.classList.add('layer-active');

        var canvas = document.createElement('canvas');
        canvas.setAttribute('width', '100');
        canvas.setAttribute('height', '100');
        
        var name = document.createElement('p');
        name.innerHTML = 'layer' + (this.layerList.length+1);

        layer.appendChild(canvas);
        layer.appendChild(name);

        for(var i = 0; i < this.layerArea.getElementsByClassName('layer').length; i++) {
            this.layerArea.getElementsByClassName('layer')[i].classList.remove('layer-active');
        }

        this.layerArea.insertBefore(layer, this.layerArea.childNodes[0]);

        layer.addEventListener('click', this.layerClick.bind(this));

        this.layerList.unshift(new DotLayer('layer' + (this.layerList.length+1), this.context));
        this.generateJson();
    }
    DotEditor.prototype.removeLayer = function() {
        if(this.layerList.length == 1) {
            alert('레이어는 최소한 1개 이상 존재해야 합니다.');
            return;
        }
        this.layerArea.removeChild(this.layerArea.getElementsByClassName('layer')[this.layerIndex]);
        this.layerList.splice(this.layerIndex, 1);

        if(this.layerList.length-1 < this.layerIndex) {
            this.layerIndex-=1;
        }


        for(var i = 0; i < this.layerArea.getElementsByClassName('layer').length; i++) {
            this.layerArea.getElementsByClassName('layer')[i].classList.remove('layer-active');
        }
        this.layerArea.getElementsByClassName('layer')[this.layerIndex].classList.add('layer-active');
        this.generateJson();
        this.draw();
    }
    DotEditor.prototype.layerClick = function(event) {
        for(var i = 0; i < event.currentTarget.parentElement.getElementsByClassName('layer').length; i++) {
            event.currentTarget.parentElement.getElementsByClassName('layer')[i].classList.remove('layer-active');
        }
        event.currentTarget.classList.add('layer-active');

        this.layerIndex = [].slice.call(event.currentTarget.parentElement.getElementsByClassName('layer')).indexOf(event.currentTarget)

        if(this.layerIndex == -1) {
            console.log('error');
        }
    }
    DotEditor.prototype.drawFrame = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawLine(new Point(0, 0), new Point(this.width+50, 0));
        this.drawLine(new Point(0, this.height+50), new Point(this.width+50, this.height+50));

        this.drawLine(new Point(0, 0), new Point(0, this.height+50));
        this.drawLine(new Point(this.width+50, 0), new Point(this.width+50, this.height+50));
    }
    DotEditor.prototype.drawLine = function(p1, p2) {
        var context = this.context;
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
    }
    DotEditor.prototype.drawCurve = function(p1, p2, cp) {
        var context = this.context;

        context.beginPath();
        context.moveTo(p1.x,p1.y);
        context.quadraticCurveTo(cp.x, cp.y, p2.x, p2.y);
        context.stroke();
    }
    DotEditor.prototype.drawPoint = function(p) {
        var context = this.context;
        var diameter = p.mouseOver == true ? 5 : 1.5;

        context.beginPath();
        context.arc(p.x+25, p.y+25, diameter, 0, 2 * Math.PI, false);
        context.fill(); 
    }
    DotEditor.prototype.generateJson = function() {
        let json = {
            'width': this.width,
            'height': this.height,
            'row': this.row,
            'col': this.col,
            'datas': {}
        };

        this.layerList.map(function(layer, index) {
            var innerJson = [];
            layer.lineList.map(function(line) {
                var type = line.mode;
                var ininjson = {};
                ininjson.type = type;
                ininjson.points = {};
                ininjson.points.p1 = [line.p1.col, line.p1.row];
                ininjson.points.p2 = [line.p2.col, line.p2.row];

                if(type != 'line') {
                    ininjson.points.p3 = [line.p3.col, line.p3.row]
                }
                innerJson.push(ininjson);
            })
            json.datas[layer.name] = innerJson;

        })
        document.getElementById('json').value = JSON.stringify(json, null, 4);
    }
    DotEditor.prototype.move = function(e) {
        this.process(e);
        this.draw(e);
    }
    DotEditor.prototype.click = function(e) {
        var processed = false;

        switch(this.mode) {
            case 'line' :
                for(var i = 0; i < this.pointList.length; i++) {
                    var p = this.pointList[i]
                    if(this.p1 == null && p.mouseOver) {
                        processed = true;
                        this.p1 = p;
                        break;
                    }
                    else if(this.p1 != null && p.mouseOver) {
                        this.layerList[this.layerIndex].addLine(new Line(this.p1, p));
                        this.generateJson();
                        this.p1 = null;
                        this.p2 = null;
                        processed = true;
                        break;
                    }
                }
            break;
            case 'curve':
                for(var i = 0; i < this.pointList.length; i++) {
                    var p = this.pointList[i]

                    if(this.p1 == null && p.mouseOver == true) {
                        processed = true;
                        this.p1 = p;
                        break;
                    }
                    else if(this.p1 != null && this.p2 == null && p.mouseOver == true) {
                        processed = true;
                        this.p2 = p;
                        break;
                    }
                    else if(this.p1 != null && this.p2 != null && p.mouseOver == true) {
                        processed = true;
                        this.layerList[this.layerIndex].addCurve(new Line(this.p1, this.p2, p));
                        this.generateJson();
                        this.p1 = null;
                        this.p2 = null;
                        break;
                    }
                }
            break;
        }
        if(processed == false) {
            this.pointList.map(function(p) {
                p.mouseOver = false;
            })
            this.p1 = null;
            this.p2 = null;
        }
        this.draw();
    }
    DotEditor.prototype.process = function(e) {
        var offsetTop = this.canvas.offsetTop;
        var offsetLeft = this.canvas.offsetLeft;

        this.pointList.map(function(p) {
            if(p.x + offsetLeft + 25 + 5 >= e.pageX && p.x + offsetLeft + 25 - 5 <= e.pageX
                && p.y + offsetTop + 25 + 5 >= e.pageY && p.y + offsetTop + 25 - 5 <= e.pageY) {
                p.mouseOver = true;
            }
            else {
                p.mouseOver = false;
            }
        })

        this.mousePoint = new Point(e.pageX - offsetLeft - 25, e.pageY - offsetTop - 25);
    }
    DotEditor.prototype.draw = function(e) {
        var _ = this;

        this.drawFrame();

        this.pointList.map(function(p) {
            _.drawPoint(p);
        })

        for(var i = 0; i < this.layerList.length; i++) {
            this.layerList[i].draw();
            this.layerList[i].drawThumbnail();
        }


        switch(this.mode) {
            case 'line':
                if(this.p1 != null && this.mousePoint != null) {
                    var p1 = Object.assign({}, this.p1);
                    var p2 = Object.assign({}, this.mousePoint);

                    p1.x += 25;
                    p1.y += 25;
                    p2.x += 25;
                    p2.y += 25;

                    this.drawLine(p1, p2);
                }
            break;
            case 'curve': 
                if(this.p1 != null && this.p2 == null && this.mousePoint != null) {
                    var p1 = Object.assign({}, this.p1);
                    var p2 = Object.assign({}, this.mousePoint);

                    p1.x += 25;
                    p1.y += 25;
                    p2.x += 25;
                    p2.y += 25;

                    this.drawLine(p1, p2);
                }
                else if(this.p1 != null && this.p2 != null && this.mousePoint != null) {
                    var p1 = Object.assign({}, this.p1);
                    var p2 = Object.assign({}, this.p2);
                    let p3 = Object.assign({}, this.mousePoint);

                    p1.x += 25;
                    p1.y += 25;
                    p2.x += 25;
                    p2.y += 25;
                    p3.x += 25;
                    p3.y += 25;
                    this.drawCurve(p1, p2, p3);
                }
            break;
        }

    }


    var DotLayer = function(name, context) {
        this.lineList = new Array();
        this.curveList = new Array();
        this.context = context;
        this.name = name;
    }

    DotLayer.prototype.addLine = function(line) {
        this.lineList.push(line)
    }
    DotLayer.prototype.addCurve = function(line) {
        this.lineList.push(line);
    }
    /*
        Layer Draw
    */
    DotLayer.prototype.drawLine = function(p1, p2) {
        let context = this.context;

        context.beginPath();
        context.moveTo(p1.x+25, p1.y+25);
        context.lineTo(p2.x+25, p2.y+25);
        context.stroke();
    }
    DotLayer.prototype.drawCurve = function(p1, p2, cp) {
        var context = this.context;

        context.beginPath();
        context.moveTo(p1.x + 25,p1.y + 25);
        context.quadraticCurveTo(cp.x + 25, cp.y + 25, p2.x + 25, p2.y + 25);
        context.stroke();
    }
    DotLayer.prototype.draw = function(e) {
        var _ = this;
        this.lineList.map(function(line) {
            if(line.mode == 'line')  {
                _.drawLine(line.p1, line.p2)    
            }
            else if(line.mode == 'curve') {
                _.drawCurve(line.p1, line.p2, line.p3);
            }
        })
    }   
    DotLayer.prototype.drawThumbnail = function() {

    }


    var Point = function(x, y, row, col) {
        this.x = x;
        this.y = y;

        this.row = row;
        this.col = col;
        this.mouseOver = false;
    }

    class Line {
    constructor(p1, p2, p3, mode) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;

        p3 == null ? this.mode = 'line' : this.mode = 'curve';
    }
}

    window.DotEditor = DotEditor;
})(window)
