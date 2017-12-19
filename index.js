class cube3 {
    constructor(){
        this.dset= null;
        this.dims = [];
        this.aggs = [];
        this.rels = [];
        this.rollups = [];
    }

    dim(fx,table,name){
        cube3.CONV.insertDistinct(this.dims,x=>x.name===name,{fx,table,name});
        return this;
    }

    agg(fx,table,name){
        cube3.CONV.insertDistinct(this.aggs,x=>x.name===name,{fx,table,name});
        return this;
    }

    rollup(fx,table,name){
        cube3.CONV.insertDistinct(this.rollups,x=>x.name===name,{fx,table,name});
        return this;
    }

    rel(fx,t1,t2){
        this.rels.push({fx,t1,t2});
        return this;
    }

    data(dset){
        this.dset = dset;
        return this;
    }
}

cube3.CONV = {
    insertDistinct:function(array,findfx,d){
        !array.find(findfx) 
        && array.push(d);
    }
}

cube3.DEF = {
    defAgg:(d)=>{}
}

module.exports = cube3;