var latitude = 0.0;
var longitude = 0.0;

var loaded = false;

function jump(tag) {
    history.pushState(null,null,location.href);
    document.getElementById(tag).scrollIntoView();
}

function hotsite(cname) {
    $.ajax({
        cached: true,
        async: true,
        type: "GET",
        url: "data/"+cname+".json",
        error: function(xhr,st) {alert("Failed to load event: "+this.url) },
        success: function(evt, st, xhr) { fillData(evt) }
    })
}

function other_day(date, incr) {
    var nd = new Date()
    nd.setDate(date.getDate() + incr)
    return nd
}

function fulldate(date, backup) {
    if (date != null) {
        d = (new Date(date+"T12:00")).toLocaleDateString("pt-BR",{"day":"numeric","month":"long","year":"numeric"})
        return d
    }
    d = backup.toLocaleDateString("pt-BR",{"day":"numeric","month":"long","year":"numeric"})
    return d
}

function fillData(evt) {
    var evtdate = new Date(evt.date+"T12:00")
    var year = evtdate.toLocaleDateString("pt-BR", {"year":"numeric"})
    document.title = 'TcheLinux - ' + evt.city + ' - ' + year

    $('.city').text(evt.city)
    $('.fulldate').text(fulldate(evt.date))
    $('.institution').text(evt.institution.long_name)
    if (evt.institution.short_name)
        $('.institution_short').text(evt.institution.short_name)
    else
    $('.institution_short').text(evt.institution.long_name)
    $('.institution').attr('href',evt.institution.url)

    setMap(evt.institution.latitude, evt.institution.longitude)

    var text = $('#courses')
    if (evt.institution.courses != null) {
        if (evt.institution.courses.length == 0) text.append("a ")
        else if (evt.institution.courses.length == 1) text.append("o curso ")
        else text.append("os cursos ")
        evt.institution.courses.forEach(function(c){
            text.append($('<a>',{href:c.url, text:c.name}))
            text.append(", ")
        })
    } else {
         text.append("a ")
    }
    enrollment(evt, evtdate)

    schedule(evt, evtdate)

    $('#address').text(evt.institution.address)

    support_and_sponsors(evt)

    $('#splash').hide()
    $('body').css("overflow","auto")
    $('nav#topbar').css("pointer-events","auto")
}

function schedule(evt, evtdate) {
    var tdy = new Date()
    if (tdy <= (new Date(evt.callForPapers.deadline)) && tdy <= evtdate) {
        $('#cfp_end').text(fulldate(evt.callForPapers.deadline,other_day(evtdate,-13)))
        $('#cfp_notice').text(fulldate(evt.callForPapers.notification,other_day(evtdate,-10)))
        $('.cfp_form').attr('href',evt.callForPapers.url)
        $('#call4papers').show()
        $('#pre-schedule').show()
        $('#schedule').hide()
        $('#palestras_menu').hide()
        $('#palestras').hide()
    } else {
        $('#call4papers').hide()
        $('#pre-schedule').hide()
        $('#schedule').show()
        createSchedule(evt)
        $('#palestras_menu').show()
        $('#palestras').show()
    }
}

function createSchedule(evt) {
    if (evt.schedule == null || evt.schedule.length == 0)
        return

    var header = $('<thead>')
    var body = $('<tbody>')
    $('#schedule').append(header)
    $('#schedule').append(body)
    var row = $('<tr>', {class:"scheldule-other"})
    header.append(row)
    row.append($('<td>',{class:"schedule-time",text:"Horário"}))
    var rooms = evt.rooms.length
    evt.rooms.forEach(function(r) {
        var td = $('<td>',{class:"schedule-slot",text:"Sala "+r.number})
        if (r.subject != null && r.subject != "") {
            var sm = $('<small>',{text:r.subject})
                .css("font-style","italic")
                .css("display","block")
                .css("font-weight","lighter")
            td.append(sm)
        }
        row.append(td)
    })

    var speech=1
    for (slot in evt.schedule) {
        var mod = ""
        row = $('<tr>',{class:"scheldule-other"})
        row.append($('<td>',{class:"schedule-time",text:slot, colspan:1}))
        var sv = evt.schedule[slot].length
        var pat = /(principiante|intermedi[aá]rio|avan[cç]ado)/i
        evt.schedule[slot].forEach(function(palestra){
            var p = $('<td>',{class:"schedule-slot", colspan: (rooms-sv)+1})
            row.append(p)
            p.append($("<a>", {href:"javascript:jump('speech-"+speech+"')",}).append($("<span>",{class:"description",text:palestra.title})))
            if (palestra.level.match(pat))
                $('#palestras > div').append(infoPalestra(speech,slot,palestra))
            if (palestra.level == "Principiante") {
                p.append($("<span>",{class:"label label-success", text:"Principiante"}))
            } else if (palestra.level.match(/intermedi[aá]rio/i)) {
                p.append($("<span>",{class:"label label-warning", text:"Intermediário"}))
            } else if (palestra.level.match(/avan[cç]ado/i)) {
                p.append($("<span>",{class:"label label-danger", text:"Avançado"}))
            } else {
                if (palestra.keywords == "encerramento") {
                    p.append($("<span>",{class:"label label-primary", text:"Todo o Público"}))
                    p.append($("<span>",{class:"speaker",text:"Todos os Palestrantes"}))
                    mod = "Moderador: "
                }
            }
            if (palestra.author)
                p.append($("<span>",{class:"speaker",text:mod+palestra.author}))
            speech += 1
        })
        body.append(row)
    }
}

function infoPalestra(speech, slot, palestra) {
    var div = $("<div>",{class:"speech-container",id:"speech-"+speech})
    div.append($("<span>",{class:"speech-time",text:slot}))
    var info = $("<div>",{class:"speech-info"})
    div.append(info)
    info.append($("<h3>",{class:"speech-title",text:palestra.title}))
    info.append($("<span>",{class:"speech-description", text:palestra.abstract}))
    info.append($("<h3>",{class:"speker-name",text:palestra.author}))
    info.append($("<span>",{class:"speaker-bio", text:palestra.resume}))
    return div
}

function enrollment(evt, eventdate) {
    $('.enrollment_start').text(fulldate(evt.enrollment.start, other_day(eventdate,-15)))
    $('.enrollment_end').text(fulldate(evt.enrollment.deadline,other_day(eventdate,-1)))
    $('.availability').text(evt.enrollment.availability)

    $("#pre-enrollment").hide()
    $("#in-enrollment").hide()
    $("#post-enrollment").hide()

    var tdy = new Date()
    if (tdy <= eventdate) {
        if (tdy >= (new Date(evt.enrollment.start)) && tdy < (new Date(evt.enrollment.deadline)) && !evt.enrollment.closed)
        {
            $("#in-enrollment").show()
        } else {
            $("#pre-enrollment").show()
        }
    } else {
        if (evt.result != null) {
            $("#participants").text(evt.result.attendants)
            $("#food").text(evt.result.donations)
            $("#post-enrollment").show()
        }
    }
}

function support_and_sponsors(evt) {
    add_support('#support',evt.institution)
    evt.support.forEach(add_support.bind(null,'#support'))
    evt.sponsors.forEach(add_support.bind(null,'#sponsors'))
    $('#sponsors').append(
        $('<li>', { class:"apoio-item" }).append(
            $('<a>', { href: "https://goo.gl/eLSqYm", title: "Seja um patrocinador", class: "apoio-logo apoio-link"})
                .text("Como patrocinar o Tchelinux?")
        )
    )
}

function add_support(list, sp) {
    $(list).append(
        $('<li>', { class:"apoio-item" }).append(
            $('<a>', { href: sp.url, title: sp.short_name, class: "apoio-logo apoio-link"}) .append(
                $('<img>',
                  { alt: sp.short_name, class: "photo", src: "images/"+sp.logo}
                )
            )
        )
    )
}
