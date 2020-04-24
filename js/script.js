const newLabelPosition = { x: 0, y: 0 };
const svgns = 'http://www.w3.org/2000/svg';
const svgPadding = {left:200,right:200};
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

let imageSize ={ };
detectImages();

function detectImages() {
    console.log('dete')
    const s = document.getElementsByTagName('svg')[0];
    labelData.labels = []
    if(s){
        s.remove();
    }
    const images = document.getElementsByClassName('annotation-image');
    for(image of images){
        startLabeling(document.getElementsByClassName('annotation-image')[0]);
    }
}


function startLabeling(image) {
    imageSize ={ width: image.clientWidth, height: image.clientHeight, top: getOffset(image).top, left: getOffset(image).left };
    const SVG = createSVG(imageSize);
    const svgGroupElement = document.createElementNS(svgns, 'g');
    SVG.append(svgGroupElement);
    labelData.labels.forEach((label,index) => {
        const newCoords = calculateNewCoord(labelData.image,label.position,imageSize);
        addCircle(svgGroupElement,newCoords.x, newCoords.y);
        createNewTextBox(SVG,label.label, index, newCoords.x, newCoords.y,imageSize);
    });
    document.body.prepend(SVG)
}

function createNewTextBox(svg,label,index,x,y,imageSize) {
 let xOffset = 0; 
 console.log(x,imageSize.width+svgPadding.left);
 if(x > imageSize.width+svgPadding.left){
    xOffset =  imageSize.width;
  }
  const rect = document.createElementNS(svgns,'rect');
  rect.setAttribute('width',svgPadding.left-10);
  rect.setAttribute('height',50);
  rect.setAttribute('fill','#85948f94');
  rect.setAttribute('x',xOffset+5);
  rect.setAttribute('y',((50+5)*index)+5);
  rect.setAttribute('id',index);

  svg.append(rect);
  
  const text = document.createElementNS(svgns,'text');
  text.setAttribute('value',label);
  text.setAttribute('x',xOffset+20);
  text.setAttribute('fill','black');
  text.setAttribute('y',((50+5)*index)+30)
  text.textContent = label;

  svg.append(text);

  const line = document.createElementNS(svgns,'line');
  line.setAttribute('x1',x+svgPadding.left);
  line.setAttribute('y1',y);
  line.setAttribute('x2',xOffset+svgPadding.left-5);
  line.setAttribute('y2',((50+5)*index)+30);
  line.setAttribute('style','stroke:rgb(0,0,0);stroke-width:1');

  svg.append(line);

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
    SVG.style.zIndex = 500;
    SVG.style.marginTop = imageSize.top + 'px';
    SVG.style.marginLeft = imageSize.left-svgPadding.left + 'px';
    SVG.style.height = imageSize.height + 'px';
    SVG.style.width = imageSize.width+svgPadding.left+svgPadding.right + 'px';
    // SVG.style.border = '1px solid black';
 
    //Event Listener
    SVG.addEventListener('click', (event) => {
        newLabelPosition.x = event.layerX-svgPadding.left;
        newLabelPosition.y = event.layerY;
        showOverlay();
        showCommentBox();
    });
    return SVG;
}

function addCircle(svgContainer, xPosition, yPosition) {
    const circle = document.createElementNS(svgns, 'circle');
    circle.setAttribute( 'cx', xPosition+svgPadding.left);
    circle.setAttribute( 'cy', yPosition);
    circle.setAttribute( 'r', 5);
    circle.setAttribute( 'style', 'fill: black;cursor:pointer' );

    svgContainer.appendChild(circle);
}


function getOffset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

//Auxillary functions
function hideOverlay() {
    document.getElementsByClassName('overlay')[0].style.display = 'none';
    hideCommentBox();
    hideUploadPopup();
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
        const label = document.getElementById('input').value.trim();
        const position = calculateNewCoord(imageSize, newLabelPosition, labelData.image)
        labelData.labels.push({label,position});
        const svg = document.getElementsByTagName('svg')[0];
        svg.remove();
        startLabeling(document.getElementsByClassName('annotation-image')[0]);
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
        
        startLabeling(document.getElementsByClassName('annotation-image')[0]);
    }
});
 
function showUploadPopup(){
    showOverlay();
    const uploadPopup = document.getElementsByClassName('file-upload-popup')[0];
    uploadPopup.style.display = 'block';
}

function hideUploadPopup(){
    const uploadPopup = document.getElementsByClassName('file-upload-popup')[0];
    uploadPopup.style.display = 'none';
}


function readURL() {
    input = document.getElementById('file-input');
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function (e) {
            document.getElementsByClassName('annotation-image')[0].setAttribute('src',e.target.result);
        }
        
        reader.readAsDataURL(input.files[0]);
        setTimeout(()=>{
            detectImages();
        },100)
        hideOverlay();
    }
}

// OldRange = (OldMax - OldMin)  
// NewRange = (NewMax - NewMin)  
// NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin