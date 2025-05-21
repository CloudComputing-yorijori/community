const { render } = require("ejs");
const { Where } = require("sequelize/lib/utils");

const db = require("../models"),
    Ingredient = db.ingredient,
    Menu = db.menu,
    Post = db.post,
    Image = db.image,
    Usage = db.usage,
    User = db.user,
    View = db.view,
    Comment = db.comment,
    Sequelize = require('sequelize'),
    sequelize = db.sequelize,
    Op = Sequelize.Op;

//wirte 페이지 이동
exports.getWritePage = async (req, res) => {
    try {
        res.render('write/write'); 
    } catch (err) {
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
};

//재료 받아오기
exports.getIngredients = async (req, res) => {
    try {
        const searchIngredient = req.query.searchIngredient || ''; //url로 받아오기
        console.log("Search Query:", searchIngredient); //재료 검색어 확인

        //db에서 받아올 재료 배열
        let ingredients = []; 
        
        if (searchIngredient) { 
            ingredients = await Ingredient.findAll({
                where: {
                    ingredientName: {
                        [Op.like]: `%${searchIngredient}%`
                    }
                }
            });    
        }
       
        res.send({ingredients}); //재료배열 전달
        console.log("Ingredients Found:", ingredients); // 검색 결과 확인

    } catch (err) {
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
};

//메뉴 받아오기
exports.getMenu = async (req, res) => {
    try {
        const searchMenu = req.query.searchMenu || ''; //url로 받아오기
        console.log("Search Query:", searchMenu); //매뉴 검색어 확인

        //db에서 받아올 매뉴 배열
        let selectMenu = []; 
        
        if (searchMenu) { 
            selectMenu = await Menu.findAll({
                where: {
                    menuName: {
                        [Op.like]: `%${searchMenu}%`
                    }
                }
            });    
        }
       
        res.send({selectMenu});
        console.log("Ingredients Found:", selectMenu); // 검색 결과 확인

    } catch (err) {
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
};


//이미지 gcp 로 보내고 url 반환
//받은 url 이미지 db에 담고 client로 넘김 
exports.postImage = async (req,res)=>{
    try{
        console.log(req.file);
        //이미지url 담아올 변수
        let imgurl='';
        if(req.file != undefined){
            imgurl = req.file.path; 
        }
        console.log('전달할 url', JSON.stringify(imgurl)); 
        res.json({ url: imgurl }); //json 객체로 넘긴다. 
    }
    catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
    })
    }
}

// 게시글 post 
exports.postWrite = async (req, res) => {
    try {
        console.log(`요청 :`,req.body);
        let menu=[];
        
        //받은 메뉴이름으로 id 찾기
        menu = await Menu.findAll({
                attributes: ['menuId'],
                where: {
                    menuName: {
                        [Op.like]: `%${req.body.menu}%`
                    }
                }
            });    

        //메뉴 id 확인
        console.log(`menu :`,menu[0].dataValues.menuId);
        
        //currentDate 를 위한 데이트 객체 생성
        const currentDate = new Date();
        
        //userId 가져오기
        let userId = res.locals.currentUser.getDataValue('userId');
        //post 
        if(req.body){
            await Post.create({
                  title: req.body.title,
                  content: req.body.editordata,
                  date: currentDate,
                  menuId: menu[0].dataValues.menuId,
                  userId: userId
          });
        }
    
        //post id 찾기
        let searchPostId = await Post.findAll({
                where:
                {
                    title:{
                        [Op.like]: `%${req.body.title}%` } //title로 찾음. 중복불가 처리해놓음
                }
            });


        // req.body.files가 배열인지 확인하고, 배열이 아닌 경우 배열로 변환
        let files = Array.isArray(req.body.files) ? req.body.files : [req.body.files];
        console.log(files);
        //imgurl 디비에 저장 
        if(req.body.files != ''){
            for(let i=0; i<files.length; i++){ //이미지 여러개 처리
                //gcp 경로 + 원본파일이름 =이미지 url 
                let img_url = `https://yorizori_post_img.storage.googleapis.com/yorizori_post_img/${files[i]}`;

                await Image.create({
                      //autoincrement 안되어있어서 임의로 넣음
                        postId: searchPostId[0].dataValues.postId,
                        imageUrl:img_url
                    });
                }
        }
        //post된 ingredientId 찾아서 메뉴 db에 넣기
        let ingredient = Array.isArray(req.body.ingredi) ? req.body.ingredi : [req.body.ingredi];

        console.log(ingredient.length);
        for(let i=0; i<ingredient.length; i++){
            let ingredientArr = await Ingredient.findAll({
                where:{
                    ingredientName:{
                        [Op.like]:`%${ingredient[i]}%`
                    }
                }
            });
            console.log("재료 :",ingredientArr[0].dataValues.ingredientId);
       
          //  menu usage 디비에 저장
            await Usage.create({
                ingredientId: ingredientArr[0].dataValues.ingredientId,
                postId: searchPostId[0].dataValues.postId
            });
        
        }
          res.render('write/write');
    } catch (err) {
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

// 게시글 눌렀을때 띄우기 
exports.getWritedPage = async (req,res)=>{
        try{
            let postvalue =[];
            //postId 로 post 객체 찾기
            if(req.query.postId){
               postvalue = await Post.findAll({
                    where:{
                        postId:{
                            [Op.like]:`%${req.query.postId}%`
                        }
                    }
                });
            }
            // console.log(postvalue);
            let menu =[];
            //postId 로 메뉴 객체 찾기
             menu = await Menu.findAll({
                    where:{
                        menuId:{
                            [Op.like]:`%${postvalue[0].dataValues.menuId}%`
                        }
                    } 
             });

             //postId 로 재료객체 찾기
             let ingredient=[];
             ingredient = await Usage.findAll({
                where:{
                    postId:{
                        [Op.like]:`%${req.query.postId}%`
                    }
                }
             });

             //찾은 재료id로 재료이름 배열에 담기 
             let ingredientArr=[];
             for(let i=0; i<ingredient.length; i++){
                let result= await Ingredient.findAll({
                where:{
                    ingredientId:{
                        [Op.like]:`%${ingredient[i].dataValues.ingredientId}%`
                    }
                }
             });
             ingredientArr.push(result);
            }

            let LoginuserId;
            if (res.locals.currentUser) {
                LoginuserId = res.locals.currentUser.getDataValue('userId');
            } else {
                LoginuserId = -1;
            }

            //postId로 post 닉네임 찾기 
            let nic = await User.findAll({
                where:{
                    userId:{
                        [Op.like]:`%${postvalue[0].dataValues.userId}%`
                    }
                }
            })

            //postId로 해당게시물 commet 찾기
            let comment =[];
                comment = await Comment.findAll({
                    where:{
                        postId:{
                            [Op.like]:`%${req.query.postId}%`
                        }
                    }
                });

            //comment쓴 유저 객체
            let commentUserJson=[];
            for(let i=0; i<comment.length; i++){
                commentUserJson[i] = await User.findAll({
                where:{
                    userId:{
                        [Op.like]:`%${comment[i].dataValues.userId}%`
                    }
                }
                });
            }   
            //찾은 user객체에서 닉네임 뽑기
            let commentUser = []
            for(let i=0; i<commentUserJson.length; i++){
               commentUser[i]= commentUserJson[i][0].dataValues.nickname;
               console.log(commentUser[i]);
            };
            
            //user 객체에서 프로필뽑기 
            let commentUserImg = []
            for(let i=0; i<commentUserJson.length; i++){
                commentUserImg[i]= commentUserJson[i][0].dataValues.imageUrl;
               console.log(commentUserImg[i]);
            };
            console.log(commentUserImg);
            let profileImg =  nic[0].dataValues.imageUrl

            // postId로 조회수 합산해서 찾기
            let viewCount = 0;
            const viewData = await View.findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('views')), 'totalViews']
                ],
                where: {
                    postId: req.query.postId
                },
                raw: true
            });

            if (viewData && viewData[0].totalViews) {
                viewCount = viewData[0].totalViews;
            }
            
            //writedPage 로 객체 전달
             res.render('write/writedPage',
              {
                title:postvalue[0].dataValues.title,
                content:postvalue[0].dataValues.content,
                date:postvalue[0].dataValues.date,
                menu:menu[0].dataValues.menuName,
                category:menu[0].dataValues.category,
                ingredientArr:ingredientArr,
                userId: postvalue[0].dataValues.userId,
                LoginuserId : LoginuserId,
                nicName: nic[0].dataValues.nickname,
                postId : req.query.postId,
                comment:comment,
                commentUser:commentUser,
                profileImg:profileImg,
                commentUserImg:commentUserImg,
                viewCount: viewCount
              }
            );
            
        }catch(err){
            console.error("Error loading the write page:", err);
            res.status(500).send({
                message: "Error loading the write page"
            });
        }
}

//comment post
exports.postCommentPage =async(req,res)=>{
    try{
       console.log(req.body);
       //현재 유저
       let commentUserId= res.locals.currentUser.getDataValue('userId');
       // 현재 날짜 생성
       const currentDate = new Date();
       //comment db에 저장
       await Comment.create({
          content:req.body.comment,
          createdAt:currentDate,
          postId:req.body.postId,
          userId:commentUserId
      });
      
    res.redirect('/write/getWritedPage?postId=' + req.body.postId + '&comment=' + req.body.comment+'&commentUserId=' + commentUserId);


    }catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

exports.commentUpdate = async(req,res)=>{
    try{
        await Comment.update(
            { content: req.body.commentContent },
            { where: { commentId: req.body.commentId } }
          );
        res.redirect('/write/getWritedPage?postId='+req.body.postId+'&comment='+ req.body.commentContent+'&commentUserId=' + req.body.commentUserId);
    
    }catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

exports.commentDelete= async(req,res)=>{
    try{
        const commentId = req.body.commentId;
        await Comment.destroy({
            where: {
                commentId: commentId
            }
        });
        res.redirect('/write/getWritedPage?postId='+req.body.postId);
    
    }catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

exports.viewUpdatePage=async(req,res)=>{
    try{
        console.log('postId',req.query.postId);
        res.render('write/update',{postId:req.query.postId});
    }catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

exports.updatePost=async(req,res)=>{
    try{

  //currentDate 를 위한 데이트 객체 생성
        const currentDate = new Date();
        let menu=[];
        console.log(req.body.postId);
        //받은 메뉴이름으로 id 찾기
        menu = await Menu.findAll({
                attributes: ['menuId'],
                where: {
                    menuName: {
                        [Op.like]: `%${req.body.menu}%`
                    }
                }
            });    

        //메뉴 id 확인
        console.log(`menu :`,menu[0].dataValues.menuId);
        //userId 가져오기
        let userId = res.locals.currentUser.getDataValue('userId');

        // req.body.files가 배열인지 확인하고, 배열이 아닌 경우 배열로 변환
        let files = Array.isArray(req.body.files) ? req.body.files : [req.body.files];
        console.log(files);

    //     //imgurl 디비에 저장 
        if(req.body.files != ''){
            for(let i=0; i<files.length; i++){ //이미지 여러개 처리
                //gcp 경로 + 원본파일이름 =이미지 url 
                let img_url = `https://yorizori_post_img.storage.googleapis.com/yorizori_post_img/${files[i]}`;

                await Image.update({
                        postId: req.body.postId,
                        imageUrl:img_url
                    },
                    { where: {postId:req.body.postId,} }
                );
            }
        }
         //post된 ingredientId 찾기
         let ingredient = Array.isArray(req.body.ingredi) ? req.body.ingredi : [req.body.ingredi];
         //ingredientid 찾기
        let ingredientArr =[]
        for(let i=0; i<ingredient.length; i++){
            ingredientArr = await Ingredient.findAll({
                where:{
                    ingredientName:{
                        [Op.like]:`%${ingredient[i]}%`
                    }
                }
            });
            console.log("재료 :",ingredientArr);
            console.log(ingredient[i]);
        }
          //  menu usage 디비에 저장
        await Usage.update({
            ingredientId: ingredientArr[0].dataValues.ingredientId},
            { where: {postId: req.body.postId,} }
        );

     
        //postupdate
        await Post.update( {
            title: req.body.title,
            content: req.body.editordata,
            date: currentDate,
            menuId: menu[0].dataValues.menuId,
            userId: userId
            // 여기에 다른 속성과 값 추가
          },
          { where: { postId: req.body.postId } })

          
        
        
        postvalue =[];
        postvalue = await User.findAll({
            where:{
                userId:{
                    [Op.like]:`%${userId}%`
                }
            }
        })
        console.log(postvalue);

       

        //postId로 해당게시물 commet 찾기
        let comment =[];
            comment = await Comment.findAll({
                where:{
                    postId:{
                        [Op.like]:`%${req.query.postId}%`
                    }
                }
            });

        //comment쓴 유저 객체
        let commentUserJson=[];
        for(let i=0; i<comment.length; i++){
            commentUserJson[i] = await User.findAll({
            where:{
                userId:{
                    [Op.like]:`%${comment[i].dataValues.userId}%`
                }
            }
            });
        }   
        //찾은 user객체에서 닉네임 뽑기
        let commentUser = []
        for(let i=0; i<commentUserJson.length; i++){
           commentUser[i]= commentUserJson[i][0].dataValues.nickname;
           console.log(commentUser[i]);
        };
        
        //user 객체에서 프로필뽑기 
        let commentUserImg = []
        for(let i=0; i<commentUserJson.length; i++){
            commentUserImg[i]= commentUserJson[i][0].dataValues.imageUrl;
           console.log(commentUserImg[i]);
        };
        console.log(commentUserImg);
        let profileImg =  postvalue[0].dataValues.imageUrl
        
        
        res.render('write/write');
        

    }catch(err){
        console.error("Error loading the write page:", err);
        res.status(500).send({
            message: "Error loading the write page"
        });
    }
}

exports.increaseViews=async(req,res)=>{
    var postId = req.body.postId;
    console.log(postId);
    // 여기서는 postId를 이용하여 데이터베이스에서 해당 게시글을 찾고, 조회수를 증가시키는 등의 로직을 수행합니다.

    // 예시로 조회수만 증가시키는 코드를 작성합니다.
    Post.update({ views: sequelize.literal('views + 1') }, { where: { postId: postId } })
        .then(function(updatedPost) {
            console.log('게시글 조회수가 증가되었습니다.');
            res.send('게시글 조회수가 증가되었습니다.');
        })
        .catch(function(error) {
            console.error('게시글 조회수 증가에 실패했습니다:', error);
            res.status(500).send('게시글 조회수 증가에 실패했습니다.');
        });
        
}

exports.deletePost=async(req,res)=>{
    try{
        console.log('postId:',req.body.postId )
        await Post.destroy({
            where: {postId:req.body.postId} // id가 postId와 일치하는 게시물을 삭제
        });
        res.redirect("/home");
    }catch(err){

    }
}