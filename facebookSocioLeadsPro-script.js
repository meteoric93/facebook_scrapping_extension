function Getleads() {
    facebookgroupdata();
    setTimeout(function () {
        location.reload();
    }, 10 * 60 * 1000);
}
var regex = /(<([^>]+)>)/ig;
var fb_dtsg = '';
var user_ID = '';
var composerId = '';
//Getleads();
facebookgroupdata();
function facebookgroupdata() {
    debugger;
    var fb_dtsgdata = document.getElementsByTagName('html')[0].innerHTML;
    fb_dtsg = getBetween(fb_dtsgdata, "fb_dtsg\" value=\"", "\"");
    user_ID = getBetween(fb_dtsgdata, "USER_ID\":\"", "\"");
    if (user_ID == "") {
        user_ID = getBetween(fb_dtsgdata, "ACCOUNT_ID\":\"", "\"");
    }
    composerId = getBetween(fb_dtsgdata, "composerID:\"", "\"");
    if (composerId == '') {
        composerId = getBetween(fb_dtsgdata, "xhpc_composerid\" value=\"", "\"");
    }
    var email = '';
    var emailurl = "https://www.facebook.com/settings"
    $.ajax({
        url: emailurl,
        type: "GET",
        async: true,
        success: function (emailresponse) {
            email = getBetween(emailresponse, "Primary: <strong>", "</strong>");
            email = email.replace("&#064;", "@");
        }
    });
    var paginationUrl = "https://www.facebook.com/groups/?category=manage";
    $.ajax({
        url: paginationUrl,
        type: "GET",
        async: true,
        success: function (msg) {
            //////debugger;;;
            var allGroupUrl = msg.split("_266w");
            allGroupUrl = allGroupUrl.slice(1, allGroupUrl.length);
            allGroupUrl.forEach(function (item) {
               // ////debugger;;;
                if (item.indexOf("<!DOCTYPE html>") == -1) {
                    var singleGroupUrl = getBetween(item, "href=\"", "\"").replace("\\", "");
                    if (singleGroupUrl == '') {
                        singleGroupUrl = getBetween(item, "href=\\\"", "\"").replace("\\", "");
                    }
                    var GroupName = getBetween(item, "a", "</a>");
                    if (GroupName == '') {
                        GroupName = getBetween(item, "a", "\\u003C\\/a>");
                    }
                    if (GroupName == '') {
                        GroupName = getBetween(item, "show=\"1\">", "</a>");
                    }
                    GroupId = getBetween(item, "id=", "\"");
                    GroupName = GroupName.replace(/&amp;/g, '&');
                    if (singleGroupUrl != '') {
                        singleGroupUrl = "https://www.facebook.com" + singleGroupUrl + "GroupName" + GroupName;
                        groupInsertion(singleGroupUrl, email);
                    }
                }
            });
        }
    });
}

function groupInsertion(groupUrl, email) {
   // ////debugger;;;
    var grpUrl = groupUrl.split("GroupName");
    var item = grpUrl[0];
    var membercount = 0;
    var Admin_Url = item.replace("?ref=group_browse_new", "members/");
    $.ajax({
        url: Admin_Url,
        type: "GET",
        async: true,
        success: function (pageResponse) {
            //console.log(pageResponse);
            var groupId = getBetween(pageResponse, "entity_id\":\"", "\"");
            var groupName = getBetween(pageResponse, "pageTitle\">", "<");
            var groupType = getBetween(pageResponse, "_4dbn\">", "<");
            if (groupType == '') {
                if (pageResponse.indexOf("Public Group") != -1)
                {
                    groupType = "Public";
                }
                else if (pageResponse.indexOf("Secret Group") != -1)
                {
                    groupType = "Private";
                }
                else if (pageResponse.indexOf("Closed Group") != -1)
                {
                    groupType = "Closed";
                }
            } 
            membercount = getBetween(pageResponse, ">Members <span", ">Admins <span");
            membercount = getBetween(membercount, "\">", "<");
            if (membercount == '') {
                membercount = getBetween(pageResponse, "class=\"_grt _50f8\">", "</span>");
            }

            var adminUrl = item.replace("?ref=group_browse_new", "admins");
            var lstadmin = 0;
            var adminId = '';
            var count = 0;
            var adminName = '';
            $.ajax({
                url: adminUrl,
                type: "GET",
                async: true,
                success: function (adminPagesource) {
                    //var getAdmin = adminPagesource.split("class=\"_8o _8r lfloat _ohe\"");
                    var oldgetAdmin = adminPagesource.split("groupsMemberSection_all_members");
                    var getAdmin = oldgetAdmin[0].split("id=\"admins_moderators");
                    getAdmin.forEach(function (getAdminData) {
                        if (getAdminData.indexOf("<!DOCTYPE html>") != -1) {
                            var noOfAdmin = getBetween(getAdminData, "admins/?ref=group_cover\">", "/span>");
                            noOfAdmin = getBetween(noOfAdmin, ">", "<");
                            if (noOfAdmin == "") {
                                noOfAdmin = getBetween(getAdminData, "Admins and moderators<span class=\"_1oqv _50f8\">", "</span>");
                            }
                            if (noOfAdmin == "") {
                                noOfAdmin = getBetween(getAdminData, "Admins and Moderators<span class=\"_1oqv _50f8\">", "</span>");
                            }
                            count = parseInt(noOfAdmin);
                         }
                        else {
                            var adminId1 = getBetween(getAdminData, "_", "\"");
                            var adminName1 = getBetween(getAdminData, "aria-label=\"", "\"");
                            if (lstadmin < count) {
                                lstadmin++;
                                adminId += adminId1 + "~";
                                adminName += adminName1 + "~";
                            }
                        }

                    });
                    var groupAdminId = adminId.substring(0, adminId.length - 1);
                    var groupAdminName = adminName.substring(0, adminName.length - 1);
                    var grpdata = { Groupid: groupId, Membercount: membercount, Groupadminid: groupAdminId, Groupadminname: groupAdminName, Grouptype: groupType, Groupname: groupName, username: email };
                    //console.log("grpdata>>>>>>>>>>>>>" + JSON.stringify(grpdata));
                    //const adData = "{\"Groupid\":\"" + groupId + "\",\"Membercount\":\"" + membercount + "\",\"Groupadminid\":\"" + groupAdminId + "\",\"Groupadminname\":\"" + groupAdminName + "\",\"Grouptype\":\"" + groupType + "\",\"Groupname\":\"" + groupName + "\",\"username\":\"" + user_ID + "\"}";
                    //console.log(adData);
                    $.ajax({
                        //url: "http://localhost:16766/api/Service/AddFBGroup",
                        url: "https://api.socioleadspro.com/api/Service/AddFBGroup",
                        type: "POST",
                        async: true,
                        data: grpdata,
                        success: function (grpsaveresponse) {
                            //console.log(grpsaveresponse);
                            //groupPostInsertion(groupUrl, user_ID);
                        }
                    })
                    groupPostInsertion(groupUrl, email);
                }
            })
        }
    })
}

function groupPostInsertion(groupUrl, email) {
    var grpUrl = groupUrl.split("GroupName");
    var groupUrl = grpUrl[0];
    var groupName = grpUrl[1];
    var groupUrl_Home = groupUrl.replace("?ref=group_browse_new", "");
    $.ajax({
        url: groupUrl_Home,
        type: "GET",
        async: true,
        success: function (Response_groupUrlHome) {
            var groupId = getBetween(Response_groupUrlHome, "entity_id\":\"", "\"");
            //var ajaxtoken = getBetween(Response_groupUrlHome, "ajaxpipe_token\":\"", "\"");
            //ajaxtoken = escape(ajaxtoken);
            var arr_postid = Response_groupUrlHome.split("_4-u2 mbm _4mrt _5jmm _5pat _5v3q _4-u8");
            arr_postid = arr_postid.slice(1, arr_postid.length);
            arr_postid.forEach(function (item) {
                var adImageURL = '';
                try {
                    advideoURL = getBetween(item, "aspect_ratio:1,hd_src:\"", "\"");
                    if (advideoURL == '') {
                        advideoURL = getBetween(item, "sd_src:\"", "\"");
                    }
                    //start
                    if (advideoURL == '') {
                        try {
                            adImageURL = getBetween(item, "scaledImageFitWidth img\" src=\"", "\"");
                            adImageURL = adImageURL.replace("&amp;", "&");
                            adImageURL = adImageURL.replace(/&amp;/g, "&");
                            if (adImageURL == '') {
                                adImageURL = getBetween(item, "class=\"_3chq", "/><div");
                                adImageURL = getBetween(adImageURL, "src=\"", "\"");
                                adImageURL = adImageURL.replace("&amp;", "&");
                                adImageURL = adImageURL.replace(/&amp;/g, "&");
                            }
                            if (adImageURL == '') {
                                ////debugger;;;
                                adImageURL = item.split('<img');
                                adImageURL = getBetween(adImageURL[2], "src=\"", "\"");
                                adImageURL = adImageURL.replace("&amp;", "&");
                                adImageURL = adImageURL.replace(/&amp;/g, "&");
                            }
                            if (adImageURL == '') {
                                var arrSplirimage = item.split("class=\"_kvn img\"");
                                arrSplirimage.forEach(function (image) {
                                    adImageURL = getBetween(image, "src=\"", "\"");
                                    adImageURL = adImageURL.replace("&amp;", "&");
                                    adImageURL = adImageURL.replace(/&amp;/g, "&");
                                    return;
                                });

                            }

                        }
                        catch (e) {

                        }
                    }
                    if (advideoURL == '') {
                        type = 'IMAGE';
                        advideoURL = adImageURL;
                    }
                    else if (advideoURL != '') {
                        type = 'VIDEO';
                        advideoURL = advideoURL;
                    }
                    //debugger;;
                    var postid = getBetween(item, "top_level_post_id&quot;:&quot;", "&quot;");
                    var PostUrl = "https://www.facebook.com/groups/" + groupId + "/permalink/" + postid;
                    var checkreactions = 'ftentidentifier:' + postid;
                    var arr_postreactions = Response_groupUrlHome.split(checkreactions);
                    arr_postreactions = arr_postreactions.slice(1, arr_postid.length);
                    ////debugger;;;
                    var reactionCount = getBetween(arr_postreactions[0], "reactioncount:", "reactioncountmap");
                    reactionCount = reactionCount.replace(",", "");
                    if (reactionCount == '') {
                        reactionCount = '0';
                    }

                    var commentCount = getBetween(arr_postreactions[0], "commentcount:", "commentTotalCount");
                    commentCount = commentCount.replace(",", "");
                    if (commentCount == '') {
                        commentCount = '0';
                    }
                    var shareCount = getBetween(arr_postreactions[0], "sharecount:", "sharecountreduced");
                    shareCount = shareCount.replace(",", "");
                    if (shareCount == '') {
                        shareCount = '0';
                    }
                    getFeedsdata(advideoURL, type, email, PostUrl, groupId, postid, groupName, reactionCount, commentCount, shareCount, item);
                    //end

                    //var postid = getBetween(item, "top_level_post_id&quot;:&quot;", "&quot;");
                    ////var PostUrl = "https://www.facebook.com/groups/" + groupId + "/permalink/" + postid;

                    //////debugger;;;
                    //if (advideoURL == '') {
                    //    var adScraperComposerPostUrl = "https://www.facebook.com/react_composer/scraper/?composer_id=" + composerId + "&target_id=" + user_ID + "&scrape_url=" + PostUrl + "&entry_point=feedx_sprouts&source_attachment=STATUS&source_logging_name=link_pasted&av=" + user_ID + "&dpr=1";
                    //    var adScraperComposerData = "__user=" + user_ID + "&__a=1&__dyn=5V4cjLx2ByK5A9UkKLqAyqomzFE9XG8GAdyempFLOaA4VEvxuES2N6xCay8KFGUpG4VEG5UaEObGubyRUC48G5WAxamjDK8xmAcU8UqDodEHDByU8rCAUg-nDLzA5KcyF8O49ElwQUlByECQi8yFUix6eUkg8GxqUkC-Rx2ih1G7Wxqp3FK4bDJ2u5Ey4VEWul3oy48a9EGqqrxmfCx6WLBx11yhu9KfmFqzlEyEGGfjglyRfBGqVk5HyXV98-8iyuXyES2Wq6rK8oK8GE_Ax2fKdx69hEkBHxzmeBA-FpF-23RxqmiChxC&fb_dtsg=" + fb_dtsg + "&jazoest=2658172788811151107827351685865817110211310810010355986576";
                    //    $.ajax({
                    //        url: adScraperComposerPostUrl,
                    //        type: "POST",
                    //        data: adScraperComposerData,
                    //        async: true,
                    //        //contentType: "text/javascript",
                    //        success: function (advideoresponse) {
                    //            //debugger;;
                    //            //attempt = attempt + 1;
                    //            advideoresponse = advideoresponse.replace(/u003C/g, "<").replace(/\\/g, "");
                    //            advideoURL = getBetween(advideoresponse, "sd_src\":\"", "\"");
                    //            advideoURL = advideoURL.replace(/\\/g, "").replace(/&amp;/g, "&");
                    //            if (advideoURL == '') {
                    //                try {
                    //                    adImageURL = getBetween(item, "scaledImageFitWidth img\" src=\"", "\"");
                    //                    adImageURL = adImageURL.replace("&amp;", "&");
                    //                    adImageURL = adImageURL.replace(/&amp;/g, "&");
                    //                    if (adImageURL == '') {
                    //                        adImageURL = getBetween(item, "class=\"_3chq", "/><div");
                    //                        adImageURL = getBetween(adImageURL, "src=\"", "\"");
                    //                        adImageURL = adImageURL.replace("&amp;", "&");
                    //                        adImageURL = adImageURL.replace(/&amp;/g, "&");
                    //                    }
                    //                    if (adImageURL == '') {
                    //                        ////debugger;;;
                    //                        adImageURL = item.split('<img');
                    //                        adImageURL = getBetween(adImageURL[2], "src=\"", "\"");
                    //                        adImageURL = adImageURL.replace("&amp;", "&");
                    //                        adImageURL = adImageURL.replace(/&amp;/g, "&");
                    //                    }
                    //                    if (adImageURL == '') {
                    //                        var arrSplirimage = item.split("class=\"_kvn img\"");
                    //                        arrSplirimage.forEach(function (image) {
                    //                            adImageURL = getBetween(image, "src=\"", "\"");
                    //                            adImageURL = adImageURL.replace("&amp;", "&");
                    //                            adImageURL = adImageURL.replace(/&amp;/g, "&");
                    //                            return;
                    //                        });

                    //                    }

                    //                }
                    //                catch (e) {

                    //                }
                    //            }
                    //            if (advideoURL == '') {
                    //                type = 'IMAGE';
                    //                advideoURL = adImageURL;
                    //            }
                    //            else if (advideoURL != '') {
                    //                type = 'VIDEO';
                    //                advideoURL = advideoURL;
                    //            }
                    //            //debugger;;
                    //            var checkreactions = 'ftentidentifier:' + postid;
                    //            var arr_postreactions = Response_groupUrlHome.split(checkreactions);
                    //            arr_postreactions = arr_postreactions.slice(1, arr_postid.length);
                    //            ////debugger;;;
                    //            var reactionCount = getBetween(arr_postreactions[0], "reactioncount:", "reactioncountmap");
                    //            reactionCount = reactionCount.replace(",", "");
                    //            if (reactionCount == '') {
                    //                reactionCount = '0';
                    //            }

                    //            var commentCount = getBetween(arr_postreactions[0], "commentcount:", "commentTotalCount");
                    //            commentCount = commentCount.replace(",", "");
                    //            if (commentCount == '') {
                    //                commentCount = '0';
                    //            }
                    //            var shareCount = getBetween(arr_postreactions[0], "sharecount:", "sharecountreduced");
                    //            shareCount = shareCount.replace(",", "");
                    //            if (shareCount == '') {
                    //                shareCount = '0';
                    //            }
                    //            getFeedsdata(advideoURL, type, email, PostUrl, groupId, postid, groupName, reactionCount, commentCount, shareCount, item);

                    //        }
                    //    });
                    //}

                }
                catch (e) {

                }
            })
        }
    });
}
function getFeedsdata(advideoURL, type, email, PostUrl, groupId, postid, groupName, reactionCount, commentCount, shareCount, item) {
    //debugger;
    try
    {
        var dateTimeOfPost = '';
        var userProfileId = '';
        var profileName = '';
        var postImgUrl = ''
        var profileImage = '';
        var Poster_ID = '';
        var PosterName = '';
        //console.log(item);
        groupName = groupName.replace(/<[^>]*>/g, '');
        dateTimeOfPost = getBetween(item, "data-utime=\"", "\"");
        PosterName = getBetween(item, "alt=\"\" aria-label=\"", "\"");
        if (PosterName == '') {
            PosterName = getBetween(item, "alt=\"\" aria-label=\"", "role=\"img\"");
        }
        PosterName = PosterName.replace(/&amp;/g, '&');
        PosterName = PosterName.replace(/<[^>]*>/g, '');

        userProfileId = getBetween(item, "member_id=", ";");
        userProfileId = userProfileId.replace(/&amp/g, "");;
        if (userProfileId=='')
        {
            userProfileId = user_ID;
        }
        profileImage = getBetween(item, "_s0 _4ooo _5xib _44ma _54ru img\" src=\"", "\"");
        if (profileImage == '') {
            profileImage = getBetween(item, "_s0 _4ooo _5xib _5sq7 _44ma _rw img\" src=\"", "\"");
        }
        profileImage = profileImage.replace(/&amp;/g, "&");
        if (advideoURL == profileImage) {
            advideoURL = '';
        }

        var FeedText = getBetween(item, "<p>", "</p>");
        FeedText = FeedText.replace(/<[^>]*>/g, '').replace("&#039;", "").replace("&amp;", "&");
        FeedText = FeedText.replace(/&amp;/g, '&');

        var FeedTitle = getBetween(item, "mbs _6m6 _2cnj _5s6c", "class=\"_6m7 _3bt9\"");
        FeedTitle = getBetween(FeedTitle, "<a", "</a>");
        FeedTitle = FeedTitle + '<a>';
        FeedTitle = getBetween(FeedTitle, "\">", "<a>");
        FeedTitle = FeedTitle.replace(/<[^>]*>/g, '');
        FeedTitle = FeedTitle.replace(/&amp;/g, '&');

        var FeedDescriptionText = getBetween(item, "class=\"_6m7 _3bt9\">", "</div>");
        var FeedDescriptionLink = getBetween(item, "class=\"_6lz _6mb _1t62 ellipsis\">", "</div>");
        var FeedDescription = FeedDescriptionText + FeedDescriptionLink;
        FeedDescription = FeedDescription.replace(/<[^>]*>/g, '');
        FeedDescription = FeedDescription.replace(/&amp;/g, '&');

        var destinationURlTemp = getBetween(item, "class=\"mbs _6m6 _2cnj _5s6c\"><a", "\">");
        destinationURlTemp = destinationURlTemp + '<a>';
        var destinationURl = getBetween(destinationURlTemp, "href=\"", "<a>");
        if (destinationURl != '') {
            destinationURl = destinationURl.replace("https://l.facebook.com/l.php?u=", "");
            destinationURl = destinationURl.replace("&amp;", "&");
            destinationURl = destinationURl.replace(/&amp;/g, "&");
            destinationURl = unescape(destinationURl);
            if (destinationURl.includes("&h=AT") || destinationURl.includes('&h=AT')) {
                var tempurl = destinationURl.split('&h=AT');
                destinationURl = tempurl[0];

            }
        }
        var grpPostdata = { GroupId: groupId, PostType: type, GroupName: groupName, FeedText: FeedText, FeedTitle: FeedTitle, FeedDescription: FeedDescription, DestinationURL: destinationURl, PostId: postid, UserProfileId: userProfileId, ProfileName: PosterName, ProfileImage: profileImage, postImgUrl: advideoURL, NoOfLike: reactionCount, NoOfComment: commentCount, NoOfShare: shareCount, DateTimeOfPost: dateTimeOfPost, postUrl: PostUrl }
        console.log("grpPostdata>>>>>>>>>>>>>" + JSON.stringify(grpPostdata));
        $.ajax({
           //url: "http://localhost:16766/api/Service/AddFBGroupPost",
           url: "https://api.socioleadspro.com/api/Service/AddFBGroupPost",
            type: "POST",
            async: true,
            data: grpPostdata,
            success: function (grpsaveresponse) {
                //console.log(grpsaveresponse);
                //groupPostInsertion(groupUrl, user_ID);
            }
        })
    }
    catch(e)
    {

    }
    
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