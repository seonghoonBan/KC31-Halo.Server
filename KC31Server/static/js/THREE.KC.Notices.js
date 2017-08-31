function notice(text, alertType='info') {
	$("#alertConsole").prepend('<div class="alert alert-'+alertType+' alert-dismissable"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' + text + '</div>')
}