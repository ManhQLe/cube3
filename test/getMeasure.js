const cube3 = require('../src/index')

const dataSet = {
    "Orders":[
        {Id:1,Cust:'A',Date:'10/12/2015'},        
        {Id:2,Cust:'B',Date:'03/09/2016'},
        {Id:3,Cust:'C',Date:'05/12/2017'},
        {Id:4,Cust:'D',Date:'01/01/2018'},
        {Id:5,Cust:'E',Date:'09/05/2018'},
        {Id:6,Cust:'A',Date:'12/01/2015'}
    ],
    "Items":[
        {OrderId:1,Item:'Orange',Cost:0.5},
        {OrderId:1,Item:'Apple',Cost:0.8},
        {OrderId:1,Item:'Apple',Cost:0.8},
        {OrderId:1,Item:'Apple',Cost:0.8},
        {OrderId:1,Item:'Pinapple',Cost:1.5},
        {OrderId:2,Item:'Orange',Cost:0.5},
        {OrderId:2,Item:'Orange',Cost:0.5},
        {OrderId:3,Item:'Orange',Cost:0.5},
        {OrderId:3,Item:'Pinapple',Cost:1.5},
        {OrderId:3,Item:'Pinapple',Cost:1.5},
        {OrderId:4,Item:'Apple',Cost:0.8},
        {OrderId:4,Item:'Mango',Cost:1},
        {OrderId:4,Item:'Orange',Cost:0.5},
        {OrderId:3,Item:'Mango',Cost:1},
        {OrderId:3,Item:'Mango',Cost:1},
        {OrderId:2,Item:'Orange',Cost:0.5},
        {OrderId:2,Item:'Mango',Cost:1},
        {OrderId:5,Item:'Apple',Cost:0.8},
        {OrderId:5,Item:'Orange',Cost:0.5},
        {OrderId:5,Item:'Orange',Cost:0.5},
        {OrderId:5,Item:'Mango',Cost:1},
        {OrderId:6,Item:'Apple',Cost:0.8},
        {OrderId:6,Item:'Mango',Cost:1},
        {OrderId:6,Item:'Orange',Cost:0.5},        
        {OrderId:6,Item:'Orange',Cost:0.5},
    ]
}

var cube = new cube3();
cube.dim(d=>d.Cust,"Orders","Customer")
.dim(d=>d.OrderId,"Items","OrderId")
.dim(d=>d.Item,"Items","Item")
.agg(d=>1,"Items","Count")
.agg(d=>d.Cost,"Items","Cost")
.rollup((a,b)=>{
    return a && b?a+b:(a?a:b);
},"Count")
.rollup((a,b)=>{
    return a && b? a+b:(a?a:b);
},"Cost")
.data(dataSet);

// console.log(cube.dims)

// console.log(cube.getDims(["Customer","OrderId","Item"]))

console.log(cube.getMeasure(["Cost"]))