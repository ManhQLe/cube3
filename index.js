class cube3 {
    constructor(){
        this.dset= null;
        this.dims = [];
        this.aggs = [];
        this.rels = [];
        this.rollups = [];
    }

    dim(fx,table,name,compare = cube3.DEF.defComp){
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

    getDims(dims){
        const tnames = Object.keys(this.dset);
        const {dset} = this;
        const dlen = tnames.reduce((a,b)=> Math.max(a,dset[b].length),0);
        const fdims = this.dims.filter(d=>dims.indexOf(d.name)>=0);

        const result = {};

        cube3.oneLoop([dlen,tnames.length,fdims.length],(idx)=>{
            const [i,ni,di] = idx;
            const tname = tnames[ni]
            const tab = dset[tname];
            if(i<tab.length){
                const d = tab[i];
                const dim = fdims[di];
                if(tname === dim.table){
                    const a = result[tname] || (result[tname] = [])
                    a.find(x=>dim.compfx(x,))
                }
            }
        })
    }

    getMeasure(m){

    }

}

cube3.oneLoop = function (Lens, fx) {
    var DimLen = Lens.length;
    var Total = DimLen;
    var Granula = [];
    var Idx = [];
    var i = 0, r, c;
    var k = 1;
    var inc;
    Lens.forEach(function (l, s) {
        Granula.push(k);
        k *= Lens[DimLen - (s + 1)];
        Idx.push(l);
        Total *= l;
    })
    Granula.reverse();
    while (i < Total) {
        r = Math.floor(i / DimLen);
        c = i % DimLen;
        c == 0 ? k = r : 0;
        Idx[c] = Math.floor(k / Granula[c]);
        k = k % Granula[c];
        (c == DimLen - 1) ? (
            inc = fx(Idx, r, Granula),
            i += (inc ? (inc - 1) * DimLen : 0)
        ) : 0;
        i++;

    }
}

cube3.CONV = {
    insertDistinct:function(array,findfx,d){
        !array.find(findfx) 
        && array.push(d);
    }    
}

cube3.DEF = {
    defAgg:(d)=>{},
    defComp:(a,b)=>a===b?0:(a>b?-1:1)
}

module.exports = cube3;