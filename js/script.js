const svgns = 'http://www.w3.org/2000/svg';

let selectedElementId = null;

const svgPadding = { left: 0, right: 0, top: 0, bottom: 0 };

let svgGroupElement;

let svgMovingGroupElement;

let labelData = {}

let imageSize = {};

const editingMode = true;

let selectedElement = null;

let SVG;

detectImages();

function detectImages() {
    const svg = document.getElementsByTagName('svg')[0];
    labelData.labels = [];
    if (svg) {
        svg.remove();
    }
    const images = document.getElementsByClassName('annotation-image');
    for (image of images) {
        labelData = JSON.parse(image.getAttribute('data'));
        startLabeling(image);
    }
}

function startLabeling(image) {

    const imageId = getRandomIntInclusive(0, 999);

    if (editingMode == true) {
        addToolBox(image, imageId);
    }

    imageSize = {
        width: image.clientWidth,
        height: image.clientHeight,
        top: getOffset(image).top,
        left: getOffset(image).left
    };

    const createSvgResult = createSVG(imageSize, imageId),
        SVG = createSvgResult.SVG,
        svgGroupElement = createSvgResult.svgGroupElement;

    image.setAttribute('id', imageId);

    document.body.prepend(SVG);

    labelData.labels.forEach(
        (label, index) => {
            const newCoords = calculateNewCoord(labelData.image, label.position, imageSize);
            addCircle(newCoords.x, newCoords.y, imageId);
            createNewTextBox(SVG, label.label, index, newCoords.x, newCoords.y, imageSize);
        }
    );
}

function addToolBox(image, imageId) {
    const container = image.parentElement;
    const rightToolBox = document.createElement('span');
    rightToolBox.classList.add('toolbar', 'pull-right')
    rightToolBox.innerHTML = `
                            <i class="tool fas fa-grip-lines-vertical" onclick="handleLineCLick(${imageId})"></i>
                            <i class="tool fas fa-font" onclick="handleTextClick(${imageId})"></i>
                            <i class="tool far fa-square" onclick="handleRectangleClick(${imageId})"></i>
                            <i class="tool fas fa-circle" onclick="handleCircleClick(${imageId})"></i>
                          `
    const leftToolBox = document.createElement('span');
    leftToolBox.classList.add('toolbar', 'pull-left');
    leftToolBox.setAttribute('id', 'svg-opt');
    leftToolBox.innerHTML = `
                            <i class="tool fas fa-arrows-alt" onclick="onSelectMove()"></i>
                            <i class="tool fas fa-trash-alt" onclick="onClickDelete()"></i>
                        `
    container.prepend(rightToolBox);
    container.prepend(leftToolBox);
}

function calculateNewCoord(actualImageSize, actualCoords, newImageSize) {
    const x = (actualCoords.x * newImageSize.width) / actualImageSize.width;
    const y = (actualCoords.y * newImageSize.height) / actualImageSize.height;
    return { x, y };
}

function getOffset(el) {
    const rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

function createNewTextBox(svg, label, index, x, y, imageSize) {
    const rect = document.createElementNS(svgns, 'rect');
    rect.setAttribute('width', svgPadding.left ? svgPadding.left - 20 : 0);
    rect.setAttribute('height', 50);
    rect.setAttribute('fill', '#85948f94');
    rect.setAttribute('x', 5);
    rect.setAttribute('y', y + svgPadding.top ? svgPadding.top - 25 : 0);
    rect.setAttribute('id', index);

    svg.append(rect);

    const text = document.createElementNS(svgns, 'text');
    text.setAttribute('value', label);
    text.setAttribute('x', 20);
    text.setAttribute('fill', 'black');
    text.setAttribute('y', y + svgPadding.top)
    text.textContent = label;

    svg.append(text);

    const line = document.createElementNS(svgns, 'line');
    line.setAttribute('x1', x + svgPadding.left);
    line.setAttribute('y1', y + svgPadding.top);
    line.setAttribute('x2', svgPadding.left ? svgPadding.left - 15 : 0);
    line.setAttribute('y2', y + svgPadding.top);
    line.setAttribute('style', 'stroke:rgb(0,0,0);stroke-width:1');

    svg.append(line);

}

function createSVG(imageSize, imageId) {
    const SVG = document.createElementNS(svgns, 'svg');

    //Styling
    SVG.style.position = 'absolute';
    SVG.style.zIndex = 500;
    SVG.setAttribute('imageId', imageId);
    SVG.setAttribute('id', `sv${imageId}`);
    SVG.style.marginTop = imageSize.top - svgPadding.top + 'px';
    SVG.style.marginLeft = imageSize.left - svgPadding.left + 'px';
    SVG.style.height = imageSize.height + svgPadding.top + svgPadding.bottom + 'px';
    SVG.style.width = imageSize.width + svgPadding.left + svgPadding.right + 'px';

    const svgGroupElement = document.createElementNS(svgns, 'g');

    SVG.append(svgGroupElement);

    if (editingMode) {
        makeDraggable(SVG);
    }

    return { SVG, svgGroupElement };
}

let offset;
function makeDraggable(svg) {
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
    function startDrag(evt) {
        if (evt.target.classList.contains('draggable')) {
            selectedElement = evt.target;
            offset = getMousePosition(evt);
            // Get all the transforms currently on this element
            var transforms = selectedElement.transform.baseVal;
            // Ensure the first transform is a translate transform
            if (transforms.length === 0 ||
                transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                // Create an transform that translates by (0, 0)
                var translate = svg.createSVGTransform();
                translate.setTranslate(0, 0);
                // Add the translation to the front of the transforms list
                selectedElement.transform.baseVal.insertItemBefore(translate, 0);
            }
            // Get initial translation amount
            transform = transforms.getItem(0);
            offset.x -= transform.matrix.e;
            offset.y -= transform.matrix.f;
        }
    }
    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            const coord = getMousePosition(evt);
            transform.setTranslate(coord.x - offset.x, coord.y - offset.y);        
        }
    }
    function endDrag(evt) {
        selectedElement = null;
    }

    function getMousePosition(evt) {
        const CTM = svg.getScreenCTM();
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }
}

function addCircle(xPosition, yPosition, imageId) {
    const circle = document.createElementNS(svgns, 'circle');
    circle.setAttribute('cx', xPosition + svgPadding.left);
    circle.setAttribute('cy', yPosition + svgPadding.top);
    circle.setAttribute('r', 10);
    circle.setAttribute('id', getRandomIntInclusive(1000, 1000));
    circle.setAttribute('imageId', imageId);
    circle.setAttribute('style', 'fill: black;cursor:pointer');
    const svg = document.getElementById(`sv${imageId}`);
    if (editingMode) {
        circle.setAttribute('class', 'draggable');
    }
    svg.appendChild(circle);
}


function handleCircleClick(imageId) {
    addCircle(
        imageSize.width / 2,
        imageSize.height / 2,
        imageId
    );
}

function handleLineCLick(imageId){
    addLine(
        imageSize.width / 2,
        imageSize.height / 2,
        imageId
    )
}

function handleRectangleClick(imageId) {
    addRectangle(
        imageSize.width / 2,
        imageSize.height / 2,
        imageId
    )
}
let textAddImage = null;
function handleTextClick(imageId){
    textAddImage = imageId;
    showCommentBox();
}

function addRectangle(xPosition,yPosition,imageId){
    const rect = document.createElementNS(svgns,'rect');
    const width = xPosition*2/5;
    const height =  yPosition*2/5;
    rect.setAttribute('x', xPosition-width/2 + svgPadding.left);
    rect.setAttribute('y', yPosition-height/2 + svgPadding.top);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('style', "fill:rgb(0,200,200);stroke-width:3;stroke:rgb(0,200,200);opacity:0.5");
    const svg = document.getElementById(`sv${imageId}`);
    if (editingMode) {
        rect.setAttribute('class', 'draggable');
    }
    svg.appendChild(rect);
}

function addLine(xPosition,yPosition,imageId){
    const line = document.createElementNS(svgns,'line');
    const length = xPosition*2/5;
    line.setAttribute('x1', xPosition-length/2 + svgPadding.left);
    line.setAttribute('y1', yPosition + svgPadding.top);
    line.setAttribute('x2', xPosition+length/2 + svgPadding.left);
    line.setAttribute('y2', yPosition + svgPadding.top);
    line.setAttribute('imageId', imageId);
    line.setAttribute('style',"stroke:rgb(0,0,0);stroke-width:2" )
    const svg = document.getElementById(`sv${imageId}`);
    if (editingMode) {
        line.setAttribute('class', 'draggable');
    }
    svg.appendChild(line);
}

/**
 * Generate random number within the provided min and max values.
 * @param min
 * @param max
 */
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    return value;
}

function showTools(ele, type) {
    selectedElement = {
        type: type,
        element: ele
    };
    document.getElementById('svg-opt').style.visibility = 'visible';
    selectedElement.element.style.boxShadow = '0px 0px 47px 12px rgba(30,184,53,1)';
    selectedElement.element.style.stroke = 'rgba(30,184,53,1)';
    selectedElement.element.style.strokeWidth = '3px';
}

function hideTools() {
    selectedElement.element.style.boxShadow = 'none';
    selectedElement.element.style.stroke = 'none';
    selectedElement.element.style.strokeWidth = 'none';
    selectedElement = null;
    document.getElementById('svg-opt').style.visibility = 'hidden';
}

let detectClick;

function onSelectMove() {
    if (selectedElement && selectedElement.type === 'circle') {
        const imageId = selectedElement.element.getAttribute('imageId');
        const svg = document.getElementById(`sv${imageId}`);
        detectClick = (event) => {
            if (selectedElement) {
                moveCircle(selectedElement.element, event.layerX, event.layerY);
                hideTools();
            } else {
                svg.removeEventListener('click', detectClick);
                svg.childNodes.removeEventListener('click', detectClick);
            }
        }
        svg.addEventListener('click', (event) => {
            detectClick(event);
        });
        // svg.style.cursor = 'crosshair';
    }
}

function onSubmitData() {
    if (document.getElementById('input').value.trim()) {
        const text = document.getElementById('input').value.trim();
        addText(text);
    }
    hideOverlay();
}


function moveCircle(circle, x, y) {
    if (circle) {
        console.log(x, y)
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
    }
}

function onClickDelete() {
    if (selectedElement) {
        selectedElement.element.parentElement.removeChild(selectedElement.element);
        selectedElement = null;
    }
}

function showCommentBox(){
    showOverlay();
    const uploadPopup = document.getElementsByClassName('popup')[0];
    uploadPopup.style.display = 'block';
}

function showUploadPopup(){
    showOverlay();
    const uploadPopup = document.getElementsByClassName('file-upload-popup')[0];
    uploadPopup.style.display = 'block';
}

function hideUploadPopup(){
    const uploadPopup = document.getElementsByClassName('file-upload-popup')[0];
    uploadPopup.style.display = 'none';
}


function showOverlay() {
    document.getElementById('input').autofocus = true;
    document.getElementsByClassName('overlay')[0].style.display = 'block';
}

//Auxillary functions
function hideOverlay() {
    document.getElementsByClassName('overlay')[0].style.display = 'none';
    hideCommentBox();
    hideUploadPopup();
}

function hideCommentBox() {
    document.getElementsByClassName('popup')[0].style.display = 'none';
    document.getElementById('input').value = '';
}

function hideUploadPopup(){
    const uploadPopup = document.getElementsByClassName('file-upload-popup')[0];
    uploadPopup.style.display = 'none';
}
