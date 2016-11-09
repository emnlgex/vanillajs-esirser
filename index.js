/**
 * Created by emmanuel on 10/19/16.
 */

/*
 * ESI Parser 1.00 - Poor Man's ESI
 *
 * - or - I'm tired of seeing the wrong thing in my browser while developing.
 *
 * This code provides a client-side ESI parsing capability.  It was created
 * to provide an easier way of developing and testing sites that use ESI
 * when not behind the cache or other system that provides the ESI parsing.
 * It requires jQuery (anything after v1.2 should be fine)
 *
 * Copyright (c) 2008 Jay Kuri (jayk - cpan.org)
 * Forked by Emmanuel Ortiz
 *
 * Licensed under the GPL.
 * Other licensing available upon request.
 * Date: 2008-09-17
 *
 *
 *
 */

function do_esi_parsing( element, callback ) {
    if (element == document) {
        // if we are processing the document element, we have
        // to get the body and head elements contents and do our
        // esi substitution.

        var head = document.getElementsByTagName("head");
        if(head.length) {
            esi_strip_esi_comments(head.item(0));
        }

        esi_strip_esi_comments(document.body);
    }

    var includes = esi_get_subelements_by_name(element, 'esi:include');

    var includes_total = includes.length+1;

    for (var i = includes.length -1 ; i >= 0 ; i-- ) {
        var include = includes[i];
        var src = include.getAttribute('src');
        var children = include.childNodes;
        for (var j = children.length - 1; j >= 0 ; j--) {
            var child = include.removeChild(children[j]);
            include.parentNode.insertBefore(child, include.nextSibling);

        }
        esi_get_page(include,src, callback);
    }
    var removes = esi_get_subelements_by_name(element, 'esi:remove');
    for (var k = removes.length -1; k >=0 ; k--) {
        removes.parentNode.removeChild(removes[k]);
    }
    return includes_total;
}
function esi_get_page(element,src, callback) {
    var self = element;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);
    xhr.onreadystatechange = function () {

        if(xhr.readyState === XMLHttpRequest.DONE) {
            if(xhr.status === 200) {
                var data = xhr.responseText;
                //console.log("success");

                if (data.indexOf('<!--esi') != -1) {
                    data = data.replace(/\n/g,'\uffff').replace(/<!--esi(.*)-->/gm, "$1").replace(/\uffff/g,'\n');;
                }
                var parent;
                if (self && self.parentNode) {
                    parent = self.parentNode;
                } else {
                    return;
                }

                var div = document.createElement("div");
                div.innerHTML = data;

                var subelement = self.parentNode.insertBefore(div.firstElementChild,self);
                self.parentNode.removeChild(self);
                if (data.indexOf('esi:include') != -1) {
                    do_esi_parsing(parent);
                }

                if(typeof callback === "function") {
                    callback();
                }


            } else {
                //console.error({status: xhr.status, response: xhr.responseText});
                throw "Error fetching resource"
            }
        }

    };
    xhr.send();
}
function esi_get_subelements_by_name(element,elementname) {
    var found = [];
    elementname = elementname.toLowerCase();

    if (element.nodeType == 9 || element.nodeType == 1) {
        var children = element.childNodes;
        for (var i = 0; i < children.length ; i++ ) {
            var elem = children[i];
            if (elem.nodeType == 1) {
                var tagname = elem.tagName.toLowerCase();
                if (tagname == elementname) {
                    found.push(element.childNodes[i]);
                }
                if ( elem.childNodes.length > 0) {
                    var res = esi_get_subelements_by_name(elem,elementname);
                    found = found.concat(res);
                }
            }
        }
    }
    return found;
}

function esi_strip_esi_comments(element) {
    var reg = /<!--esi(.*)-->/gm;
    var data = element.innerHTML
        , newData
        ;
    if (data.indexOf('<!--esi') != -1) {
        newData = data.replace(/\n/g,'\uffff').replace(reg, "$1").replace(/\uffff/g,'\n');
        element.innerHTML(newData);
    }
}

exports.do_esi_parsing = do_esi_parsing;
