const {HNN, KKMA} = require('koalanlp/API');
const {initialize} = require('koalanlp/Util');
const {Tagger, Parser} = require('koalanlp/proc');

async function executor(){
    await initialize({packages: {HNN: '2.1.4', KKMA: '2.1.4'}, verbose: true});

    let tagger = new Tagger(HNN);
    let tagged = await tagger("나는 하늘을 나는 자동차를 탔다");
    for(const sent of tagged) {
	console.log("[TAG] "+sent.toString());
    }

    let parser = new Parser(HNN);
    let parsed = await parser("나는 하늘을 나는 자동차를 탔다");
    for(const sent of parsed){
        console.log(sent.toString());
        for(const dep of sent.dependencies){
            console.log("[Parse] "+dep.toString());
        }
    }
}

executor().then(
    () => console.log('finished!'), 
    (error) => console.error('Error Occurred!', error)
);
