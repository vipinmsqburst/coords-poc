const newLabelPosition = { x: 0, y: 0 };
const svgns = 'http://www.w3.org/2000/svg';

const labelData = {
    image: {
        height: 2000,
        width: 3000
    },
    labels: [
        {
            position: {
                x: 120,
                y: 120
            },
            label:'Hi all'
        }
    ]
}


const image = document.getElementById('image');
let imageSize = { width: image.clientWidth, height: image.clientHeight, top: image.offsetTop, left: image.offsetLeft }

startLabeling();

function startLabeling(){
    imageSize = { width: image.clientWidth, height: image.clientHeight, top: image.offsetTop, left: image.offsetLeft }
    const SVG = createSVG(imageSize);
    const svgGroupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    SVG.append(svgGroupElement);
    labelData.labels.forEach(label => {
        const newCoords = calculateNewCoord(labelData.image,label.position,imageSize);
        addCircle(svgGroupElement,newCoords.x, newCoords.y);
    });
    document.body.appendChild(SVG);
}

function calculateNewCoord(actualImageSize, actualCoords, newImageSize) {
    const x = (actualCoords.x*newImageSize.width)/actualImageSize.width;
    const y = (actualCoords.y*newImageSize.height)/actualImageSize.height;
    return {x,y};
}

function createSVG(imageSize) {
    const SVG = document.createElementNS(svgns,'svg');

    //Styling
    SVG.style.position = 'absolute';
    SVG.style.top = imageSize.top + 'px';
    SVG.style.left = imageSize.left + 'px';
    SVG.style.height = imageSize.height + 'px';
    SVG.style.width = imageSize.width + 'px';
    SVG.style.border = '0.2px solid black';

    //Event Listener
    SVG.addEventListener('click', (event) => {
        newLabelPosition.x = event.layerX;
        newLabelPosition.y = event.layerY;
        showOverlay();
        showCommentBox();
    });
    return SVG;
}

function addCircle(svgContainer, xPosition, yPosition) {
    const circle = document.createElementNS(svgns, 'circle');
    circle.setAttribute( 'cx', xPosition);
    circle.setAttribute( 'cy', yPosition);
    circle.setAttribute( 'r', 5);
    circle.setAttribute( 'style', 'fill: red;cursor:pointer' );

    svgContainer.appendChild(circle);
}


//Auxillary functions
function hideOverlay() {
    document.getElementsByClassName('overlay')[0].style.display = 'none';
    hideCommentBox();
}

function showOverlay() {
    document.getElementById('input').autofocus = true;
    document.getElementsByClassName('overlay')[0].style.display = 'block';
}

function showCommentBox() {
    document.getElementsByClassName('popup')[0].style.display = 'block';
}

function hideCommentBox() {
    document.getElementsByClassName('popup')[0].style.display = 'none';
    document.getElementById('input').value = '';
}

function onSubmitData() {
    // if (document.getElementById('input').value.trim()) {
        const label = document.getElementById('input').value;
        const position = calculateNewCoord(imageSize, newLabelPosition, labelData.image)
        console.log(position);
        labelData.labels.push({label,position});
        const svg = document.getElementsByTagName('svg')[0];
        svg.remove();
        startLabeling();
        console.log(JSON.stringify(labelData));
    // }
    hideOverlay();
}

let resizeId; 
window.addEventListener('resize',() => {
    clearTimeout(resizeId);
    const svg = document.getElementsByTagName('svg')[0];
    if(svg){
        svg.remove();
    }
    resizeId = setTimeout(doResize, 100);
    function doResize(){
        
        startLabeling();
    }
});

 

// OldRange = (OldMax - OldMin)  
// NewRange = (NewMax - NewMin)  
// NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin