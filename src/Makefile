VERSION=unknown
DEVICE=1
ifdef DEVICE
# Device build
STAGING_DIR=/srv/preware/build/staging/armv7
ifeq ($(shell uname -s),Darwin)
CC=/opt/PalmPDK/arm-gcc/bin/arm-none-linux-gnueabi-gcc
else
CC=/srv/preware/build/toolchain/arm-2007q3/bin/arm-none-linux-gnueabi-gcc
endif
else
# Emulator build
STAGING_DIR=/srv/preware/build/staging/i686
CC=/srv/preware/build/toolchain/i686-unknown-linux-gnu/bin/i686-unknown-linux-gnu-gcc
endif

CPPFLAGS := -g -DVERSION=\"${VERSION}\" -I${STAGING_DIR}/usr/include/glib-2.0 -I${STAGING_DIR}/usr/lib/glib-2.0/include -I${STAGING_DIR}/usr/include
LDFLAGS  := -g -Wl,-rpath -Wl,${STAGING_DIR}/usr/lib  -L${STAGING_DIR}/usr/lib -llunaservice -lmjson -lglib-2.0 -lpthread 

impersonate: impersonate.o luna_service.o luna_methods.o

HOST = cdma-pre

install: impersonate
#	- ssh root@${HOST} killall org.webosinternals.impersonate
#	scp impersonate root@${HOST}:/var/usr/sbin/org.webosinternals.impersonate.new
#	ssh root@${HOST} mv /var/usr/sbin/org.webosinternals.impersonate.new /var/usr/sbin/org.webosinternals.impersonate
	- novacom run file://usr/bin/killall -- org.webosinternals.impersonate
	novacom put file://var/usr/sbin/org.webosinternals.impersonate < impersonate

clobber:
	rm -rf *.o impersonate
