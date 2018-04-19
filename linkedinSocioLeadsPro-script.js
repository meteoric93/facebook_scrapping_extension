//window.setInterval(function () {
//    GetAds();
//}, 1 * 60 * 1000);

function Getleads() {
    linkedingroupdata();
    setTimeout(function () {
        location.reload();
    }, 10 * 60 * 1000);
}
var regex = /(<([^>]+)>)/ig;
//Getleads();
linkedingroupdata();
function linkedingroupdata() {
    var MemberID = '';
    var csrfToken = '';
    debugger;
    var Cookiesdata = document.cookie;
    csrfToken = getBetween(Cookiesdata, "JSESSIONID=\"", "\";");
    var Linkedin_data = document.getElementsByTagName('html')[0].innerHTML;
    var tempmemeberId = Linkedin_data.split("urn:li:member");
    tempmemeberId = tempmemeberId[1];
    MemberID = getBetween(tempmemeberId, ":", "&quot;");
    var GroupAPI = "https://www.linkedin.com/communities-api/v1/communities/memberships/" + MemberID + "?projection=FULL&sortBy=RECENTLY_JOINED&count=500&csrfToken=" + csrfToken;

    var linkedinurl = "https://www.linkedin.com/mynetwork/";
    var email = '';

    $.ajax({
        url: linkedinurl,
        type: "GET",
        async: true,
        success: function (profileresponse) {
            email = getBetween(profileresponse, "emailAddress&quot;:&quot;", "&quot;");
            $.ajax({
                url: GroupAPI,
                type: "GET",
                async: true,
                success: function (ReceivedResponse) {
                    //debugger;
                    var grpupresponse = ReceivedResponse["data"];
                    grpupresponse.forEach(function (groups) {
                        var totalMembers = groups["group"]["totalMembers"];
                        var groupName = groups["group"]["mini"]["name"];
                        var communityType = groups["group"]["communityType"];
                        var groupId = groups["group"]["id"];
                        var grpdata = { Groupid: groupId, Membercount: totalMembers, Groupadminid: 'NA', Groupadminname: 'NA', Grouptype: communityType, Groupname: groupName, LdUserName: email };
                        //console.log(JSON.stringify(grpdata));
                        $.ajax({
                            //url: "http://localhost:16766/api/Service/AddLIGroup",
                            url: "https://api.socioleadspro.com/api/Service/AddLIGroup",
                            type: "POST",
                            async: true,
                            data: grpdata,
                            success: function (grpsaveresponse) {
                               // console.log(grpsaveresponse);
                            }
                        })
                        linkedingrouppostdata(groupId, csrfToken, groupName);
                    })
                }
            });
        }
    });
       
}
function linkedingrouppostdata(grpid, csrfToken, grpname) {
    debugger;
    var grpouppostUrl = "https://www.linkedin.com/communities-api/v1/activities/community/" + grpid + "?count=10&activityType=DISCUSSION&sort=RECENT&count=10&start=0&csrfToken=" + csrfToken;
    $.ajax({
        url: grpouppostUrl,
        type: "GET",
        async: true,
        success: function (grpPostResponse) {
            var grpuppostresponse = grpPostResponse["data"];
            grpuppostresponse.forEach(function (grppost) {
                var datePosted = grppost["datePosted"];
                var posterid = grppost["author"]["id"];
                var posterName = grppost["author"]["name"];
                var profileUrl = grppost["author"]["profileUrl"];
                var author_imageUrl = grppost["author"]["imageUrl"];
                if (author_imageUrl.includes('/gcrc'))
                {
                    author_imageUrl = author_imageUrl+'<a>'
                    author_imageUrl = getBetween(author_imageUrl, "/gcrc", "<a>");
                    author_imageUrl = 'https://media.licdn.com' + author_imageUrl;
                }
                var body = grppost["body"];
                var title = grppost["title"];
                var postId = grppost["id"];
                var contentUrl = grppost["contentUrl"];
                var contentTitle = grppost["contentTitle"];
                var imageUrl = grppost["imageUrl"];
                var numberOfLikes = grppost["numberOfLikes"];
                var numberOfComments = grppost["numberOfComments"];
                var grpPostdata = { DateTimeOfPost: datePosted, GroupName: grpname, GroupId: grpid, PosterUrl: profileUrl, postId: postId, PosterImageUrl: author_imageUrl, profileName: posterName, postImgUrl: contentUrl, PostTitle: contentTitle, Message: body, contentUrl: contentUrl, contentTitle: contentTitle, numberOfLikes: numberOfLikes, numberOfComments: numberOfComments, PostedImagedescription: 'NA', PosterId: posterid };
                //console.log(JSON.stringify(grpPostdata));
                $.ajax({
                    //url: "http://localhost:16766/api/Service/AddLIGroupPost",
                    url: "https://api.socioleadspro.com/api/Service/AddLIGroupPost",
                    type: "POST",
                    async: true,
                    data: grpPostdata,
                    success: function (grppostresponse) {
                        //console.log(grppostresponse);
                    }
                })
            })
        }
    })
}








function getBetween(pageSource, firstData, secondData) {
    try {
        var resSplit = pageSource.split(firstData);
        var indexSec = resSplit[1].indexOf(secondData);
        var finalData = resSplit[1].substring(0, indexSec);
        return finalData;
    } catch (e) {
        return "";
    }
}
function reversegetBetween(pageSource, secondData, firstData) {
    try {
        var resSplit = pageSource.split(secondData);
        var indexSec = resSplit[1].indexOf(firstData);
        var finalData = resSplit[1].substring(0, indexSec);
        return finalData;
    } catch (e) {
        return "";
    }
}